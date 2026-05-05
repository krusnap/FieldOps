import { Router, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { z } from "zod";

const router = Router();
router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recalculate and update bundle totals from its child claims. */
async function syncBundleTotals(bundleId: string): Promise<void> {
  const { data: claims } = await supabaseAdmin
    .from("claims")
    .select("amount_inr, distance_km")
    .eq("bundle_id", bundleId);

  const totalAmount = (claims ?? []).reduce((s: number, c: any) => s + Number(c.amount_inr), 0);
  const totalDistance = (claims ?? []).reduce((s: number, c: any) => s + Number(c.distance_km), 0);

  await supabaseAdmin
    .from("daily_claim_bundles")
    .update({
      total_amount_inr: Math.round(totalAmount * 100) / 100,
      total_distance_km: Math.round(totalDistance * 1000) / 1000,
      trip_count: (claims ?? []).length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bundleId);
}

// ─── GET /api/bundles ─────────────────────────────────────────────────────────
// Employee: list own bundles sorted by date desc

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    let query = supabaseAdmin
      .from("daily_claim_bundles")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("claim_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ["draft", "pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: bundles, error, count } = await query;

    if (error) throw new AppError("Failed to fetch bundles", 500);

    res.json({
      success: true,
      data: bundles ?? [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/bundles/manager ─────────────────────────────────────────────────
// Manager: list bundles for assigned employees grouped — MUST be before /:id

router.get(
  "/manager",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const managerId = req.user!.id;
      const role = req.user!.role;
      const status = req.query.status as string | undefined;
      const dateFrom = req.query.date_from as string | undefined;
      const dateTo = req.query.date_to as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
      const offset = (page - 1) * limit;

      // Resolve employee IDs visible to this manager
      let employeeIds: string[] = [];
      if (role === "ADMIN") {
        const { data: users } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("role", "EMPLOYEE")
          .eq("is_active", true);
        employeeIds = (users ?? []).map((u: any) => u.id);
      } else {
        const { data: assignments } = await supabaseAdmin
          .from("employee_manager_assignments")
          .select("employee_id")
          .eq("manager_id", managerId)
          .eq("active", true);
        employeeIds = (assignments ?? []).map((a: any) => a.employee_id);
      }

      if (employeeIds.length === 0) {
        return res.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }

      let query = supabaseAdmin
        .from("daily_claim_bundles")
        .select(
          "*, users!daily_claim_bundles_user_id_fkey(id, full_name, email)",
          { count: "exact" }
        )
        .in("user_id", employeeIds)
        .order("claim_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && ["draft", "pending", "approved", "rejected"].includes(status)) {
        query = query.eq("status", status);
      }
      if (dateFrom) query = query.gte("claim_date", dateFrom);
      if (dateTo) query = query.lte("claim_date", dateTo);

      const { data: bundles, error, count } = await query;
      if (error) throw new AppError("Failed to fetch manager bundles", 500);

      res.json({
        success: true,
        data: bundles ?? [],
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/bundles/:id ─────────────────────────────────────────────────────
// Employee or Manager: get bundle + its child claims

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundleId = req.params.id;
    const userId = req.user!.id;
    const role = req.user!.role;

    const { data: bundle, error } = await supabaseAdmin
      .from("daily_claim_bundles")
      .select("*, users!daily_claim_bundles_user_id_fkey(id, full_name, email)")
      .eq("id", bundleId)
      .single();

    if (error || !bundle) throw new AppError("Bundle not found", 404);

    // Access check
    const isOwner = bundle.user_id === userId;
    const isManager = ["MANAGER", "ADMIN", "ACCOUNTANT"].includes(role);
    if (!isOwner && !isManager) throw new AppError("Access denied", 403);

    // Fetch child claims
    const { data: claims } = await supabaseAdmin
      .from("claims")
      .select("*, trips(started_at, ended_at, total_distance_km, avg_speed_kmh)")
      .eq("bundle_id", bundleId)
      .order("created_at", { ascending: true });

    res.json({ success: true, data: { ...bundle, claims: claims ?? [] } });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/bundles/:id/submit ────────────────────────────────────────────
// Employee: submit draft bundle to manager (draft → pending)

router.patch("/:id/submit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundleId = req.params.id;
    const userId = req.user!.id;

    const { data: bundle } = await supabaseAdmin
      .from("daily_claim_bundles")
      .select("id, status, user_id, trip_count")
      .eq("id", bundleId)
      .single();

    if (!bundle) throw new AppError("Bundle not found", 404);
    if (bundle.user_id !== userId) throw new AppError("Access denied", 403);
    if (bundle.status !== "draft") throw new AppError(`Bundle is already "${bundle.status}"`, 400);
    if (bundle.trip_count === 0) throw new AppError("No claims in this bundle to submit", 400);

    // Move bundle to pending
    const { data: updated, error } = await supabaseAdmin
      .from("daily_claim_bundles")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", bundleId)
      .select()
      .single();

    if (error) throw new AppError("Failed to submit bundle", 500);

    // Move all child draft claims to pending
    await supabaseAdmin
      .from("claims")
      .update({ status: "pending" })
      .eq("bundle_id", bundleId)
      .eq("status", "draft");

    logger.info("Bundle submitted", { bundleId, userId });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/bundles/:id/approve ──────────────────────────────────────────
// Manager: approve bundle + all child claims

router.patch(
  "/:id/approve",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bundleId = req.params.id;
      const reviewerId = req.user!.id;
      const now = new Date().toISOString();

      const { data: bundle } = await supabaseAdmin
        .from("daily_claim_bundles")
        .select("id, status")
        .eq("id", bundleId)
        .single();

      if (!bundle) throw new AppError("Bundle not found", 404);
      if (bundle.status !== "pending") throw new AppError(`Cannot approve a bundle with status "${bundle.status}"`, 400);

      const { data: updated, error } = await supabaseAdmin
        .from("daily_claim_bundles")
        .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: now, updated_at: now })
        .eq("id", bundleId)
        .select()
        .single();

      if (error) throw new AppError("Failed to approve bundle", 500);

      // Approve all child claims
      await supabaseAdmin
        .from("claims")
        .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: now })
        .eq("bundle_id", bundleId);

      logger.info("Bundle approved", { bundleId, reviewerId });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/bundles/:id/reject ────────────────────────────────────────────
// Manager: reject bundle (with reason). Rejection is final for the employee.

const RejectSchema = z.object({ reason: z.string().min(1, "Reason required").max(500) });

router.patch(
  "/:id/reject",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bundleId = req.params.id;
      const reviewerId = req.user!.id;
      const now = new Date().toISOString();

      const parsed = RejectSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError("Rejection reason is required", 400);

      const { data: bundle } = await supabaseAdmin
        .from("daily_claim_bundles")
        .select("id, status")
        .eq("id", bundleId)
        .single();

      if (!bundle) throw new AppError("Bundle not found", 404);
      if (bundle.status !== "pending") throw new AppError(`Cannot reject a bundle with status "${bundle.status}"`, 400);

      const { data: updated, error } = await supabaseAdmin
        .from("daily_claim_bundles")
        .update({
          status: "rejected",
          rejection_reason: parsed.data.reason,
          reviewed_by: reviewerId,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", bundleId)
        .select()
        .single();

      if (error) throw new AppError("Failed to reject bundle", 500);

      // Reject all child claims
      await supabaseAdmin
        .from("claims")
        .update({ status: "rejected", reviewed_by: reviewerId, reviewed_at: now })
        .eq("bundle_id", bundleId);

      logger.info("Bundle rejected", { bundleId, reviewerId, reason: parsed.data.reason });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/bundles/:id/note ───────────────────────────────────────────────
// Employee: add/update a note on a draft bundle before submitting

const NoteSchema = z.object({ notes: z.string().max(500) });

router.post("/:id/note", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundleId = req.params.id;
    const userId = req.user!.id;

    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid note", 400);

    const { data: bundle } = await supabaseAdmin
      .from("daily_claim_bundles")
      .select("id, status, user_id")
      .eq("id", bundleId)
      .single();

    if (!bundle) throw new AppError("Bundle not found", 404);
    if (bundle.user_id !== userId) throw new AppError("Access denied", 403);
    if (bundle.status !== "draft") throw new AppError("Can only add notes to draft bundles", 400);

    const { data: updated, error } = await supabaseAdmin
      .from("daily_claim_bundles")
      .update({ notes: parsed.data.notes, updated_at: new Date().toISOString() })
      .eq("id", bundleId)
      .select()
      .single();

    if (error) throw new AppError("Failed to update note", 500);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export { syncBundleTotals };
export default router;
