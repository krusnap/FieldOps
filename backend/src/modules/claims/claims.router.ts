import { Router, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { z } from "zod";

const router = Router();

router.use(authenticate);

// ─── Validation ──────────────────────────────────────────────────────────────

const CreateClaimSchema = z.object({
  trip_id: z.string().uuid().optional(),
  amount_inr: z.number().positive("Amount must be positive"),
  category: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
});

const RejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(500),
});

// ─── GET /api/claims ─────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("claims")
      .select("*, trips(started_at, ended_at, total_distance_km), users!claims_user_id_fkey(full_name, email)", { count: "exact" });

    // Employees see only their own claims; managers see claims from assigned employees
    if (role === "EMPLOYEE") {
      query = query.eq("user_id", userId);
    } else if (role === "MANAGER") {
      // Get assigned employee IDs
      const { data: assignments } = await supabaseAdmin
        .from("employee_manager_assignments")
        .select("employee_id")
        .eq("manager_id", userId)
        .eq("active", true);

      const employeeIds = (assignments ?? []).map((a: any) => a.employee_id);
      // Include manager's own claims too
      employeeIds.push(userId);
      query = query.in("user_id", employeeIds);
    }
    // ADMIN sees all — no filter

    if (status && ["draft", "pending", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: claims, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch claims", { error: error.message });
      throw new AppError("Failed to fetch claims", 500);
    }

    res.json({
      success: true,
      data: claims ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/claims/:id ────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claimId = req.params.id;

    const { data: claim, error } = await supabaseAdmin
      .from("claims")
      .select("*, trips(*), users!claims_user_id_fkey(full_name, email)")
      .eq("id", claimId)
      .single();

    if (error || !claim) {
      throw new AppError("Claim not found", 404);
    }

    // Check access
    if (
      claim.user_id !== req.user!.id &&
      !["MANAGER", "ADMIN", "ACCOUNTANT"].includes(req.user!.role)
    ) {
      throw new AppError("Access denied", 403);
    }

    res.json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/claims ────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const parsed = CreateClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      throw new AppError(message, 400);
    }

    const { trip_id, amount_inr, category, notes } = parsed.data;

    const insertData: Record<string, unknown> = {
      user_id: userId,
      amount_inr,
      category,
      notes: notes ?? null,
      status: "draft",
      rate_per_km: req.user!.rate_per_km ?? 10,
    };

    if (trip_id) {
      // Verify trip exists and belongs to user
      const { data: trip } = await supabaseAdmin
        .from("trips")
        .select("id, user_id, total_distance_km")
        .eq("id", trip_id)
        .eq("user_id", userId)
        .single();

      if (!trip) {
        throw new AppError("Trip not found or not owned by you", 404);
      }

      insertData.trip_id = trip_id;
      insertData.distance_km = trip.total_distance_km ?? 0;
    }

    const { data: claim, error } = await supabaseAdmin
      .from("claims")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error("Failed to create claim", { error: error.message });
      throw new AppError("Failed to create claim", 500);
    }

    logger.info("Claim created", { claimId: claim.id, userId, amount: amount_inr });

    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/claims/manager/create ─────────────────────────────────────────
// Manager: create a new claim directly on behalf of an employee
// (bypasses draft flow — goes straight to pending or approved)

const ManagerCreateClaimSchema = z.object({
  user_id: z.string().uuid("Valid employee user_id required"),
  trip_id: z.string().uuid().optional(),
  amount_inr: z.number().positive("Amount must be positive"),
  distance_km: z.number().min(0).optional(),
  category: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  status: z.enum(["pending", "approved"]).default("pending"),
});

router.post(
  "/manager/create",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = req.user!.id;

      const parsed = ManagerCreateClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(", ");
        throw new AppError(message, 400);
      }

      const { user_id, trip_id, amount_inr, distance_km, category, notes, status } = parsed.data;

      // Verify target employee exists
      const { data: targetUser } = await supabaseAdmin
        .from("users")
        .select("id, rate_per_km")
        .eq("id", user_id)
        .single();

      if (!targetUser) throw new AppError("Employee not found", 404);

      const insertData: Record<string, unknown> = {
        user_id,
        amount_inr,
        distance_km: distance_km ?? 0,
        category,
        notes: notes ?? null,
        status,
        rate_per_km: (targetUser as any).rate_per_km ?? 10,
        reviewed_by: reviewerId,
        reviewed_at: status === "approved" ? new Date().toISOString() : null,
      };

      if (trip_id) insertData.trip_id = trip_id;

      const { data: claim, error } = await supabaseAdmin
        .from("claims")
        .insert(insertData)
        .select()
        .single();

      if (error) throw new AppError("Failed to create claim", 500);

      logger.info("Manager created claim", { claimId: claim.id, reviewerId, forUser: user_id });
      res.status(201).json({ success: true, data: claim });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/claims/:id/override ──────────────────────────────────────────
// Manager: correct a rejected claim by entering km; amount is auto-calculated

const OverrideClaimSchema = z.object({
  distance_km: z.number().positive("Distance must be greater than 0"),
  notes: z.string().max(500).optional(),
  category: z.string().min(1).max(100).optional(),
});

router.patch(
  "/:id/override",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.id;
      const reviewerId = req.user!.id;

      const parsed = OverrideClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(", ");
        throw new AppError(message, 400);
      }

      // Fetch claim with rate_per_km to auto-calculate corrected amount
      const { data: claim } = await supabaseAdmin
        .from("claims")
        .select("id, status, bundle_id, rate_per_km")
        .eq("id", claimId)
        .single();

      if (!claim) throw new AppError("Claim not found", 404);
      if (claim.status !== "rejected") throw new AppError("Only rejected claims can be overridden", 400);

      const ratePerKm = Number(claim.rate_per_km) || 10;
      const correctedAmount = Math.round(parsed.data.distance_km * ratePerKm * 100) / 100;

      const updateData: Record<string, unknown> = {
        status: "pending",
        distance_km: parsed.data.distance_km,
        amount_inr: correctedAmount,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      };
      if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
      if (parsed.data.category !== undefined) updateData.category = parsed.data.category;

      const { data: updated, error } = await supabaseAdmin
        .from("claims")
        .update(updateData)
        .eq("id", claimId)
        .select()
        .single();

      if (error) throw new AppError("Failed to override claim", 500);

      // Move bundle back to pending if it was rejected
      if (claim.bundle_id) {
        await supabaseAdmin
          .from("daily_claim_bundles")
          .update({ status: "pending", rejection_reason: null, updated_at: new Date().toISOString() })
          .eq("id", claim.bundle_id)
          .eq("status", "rejected");
      }

      logger.info("Claim overridden by manager", {
        claimId,
        reviewerId,
        correctedKm: parsed.data.distance_km,
        correctedAmount,
      });
      res.json({ success: true, data: { ...updated, corrected_amount_inr: correctedAmount } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/claims/:id/approve ───────────────────────────────────────────

router.patch(
  "/:id/approve",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.id;
      const reviewerId = req.user!.id;

      const { data: claim } = await supabaseAdmin
        .from("claims")
        .select("id, status")
        .eq("id", claimId)
        .single();

      if (!claim) {
        throw new AppError("Claim not found", 404);
      }

      if (claim.status !== "pending") {
        throw new AppError(`Cannot approve a claim with status "${claim.status}"`, 400);
      }

      const { data: updated, error } = await supabaseAdmin
        .from("claims")
        .update({
          status: "approved",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claimId)
        .select()
        .single();

      if (error) {
        throw new AppError("Failed to approve claim", 500);
      }

      logger.info("Claim approved", { claimId, reviewerId });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/claims/:id/reject ────────────────────────────────────────────

router.patch(
  "/:id/reject",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claimId = req.params.id;
      const reviewerId = req.user!.id;

      const parsed = RejectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError("Rejection reason is required", 400);
      }

      const { data: claim } = await supabaseAdmin
        .from("claims")
        .select("id, status")
        .eq("id", claimId)
        .single();

      if (!claim) {
        throw new AppError("Claim not found", 404);
      }

      if (claim.status !== "pending") {
        throw new AppError(`Cannot reject a claim with status "${claim.status}"`, 400);
      }

      const { data: updated, error } = await supabaseAdmin
        .from("claims")
        .update({
          status: "rejected",
          notes: parsed.data.reason,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", claimId)
        .select()
        .single();

      if (error) {
        throw new AppError("Failed to reject claim", 500);
      }

      logger.info("Claim rejected", { claimId, reviewerId });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
