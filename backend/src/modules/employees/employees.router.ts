import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";

const router = Router();

router.use(authenticate);

// ─── GET /api/employees ───────────────────────────────────────────────────────

router.get("/", requireRole("MANAGER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    const role = req.user!.role;

    let employeeIds: string[] = [];

    if (role === "ADMIN") {
      const { data: allUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "EMPLOYEE")
        .eq("is_active", true);

      employeeIds = (allUsers ?? []).map((u: any) => u.id);
    } else {
      const { data: assignments } = await supabaseAdmin
        .from("employee_manager_assignments")
        .select("employee_id")
        .eq("manager_id", managerId)
        .eq("active", true);

      employeeIds = (assignments ?? []).map((a: any) => a.employee_id);
    }

    if (employeeIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const { data: employees, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, rate_per_km, is_active, created_at")
      .in("id", employeeIds)
      .eq("is_active", true);

    if (error) throw new AppError("Failed to fetch employees", 500);

    const enriched = await Promise.all(
      (employees ?? []).map(async (emp: any) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: trips } = await supabaseAdmin
          .from("trips")
          .select("id, status, total_distance_km")
          .eq("user_id", emp.id)
          .gte("started_at", weekAgo);

        const weeklyTrips = trips?.length ?? 0;
        const weeklyDistanceKm = (trips ?? []).reduce(
          (sum: number, t: any) => sum + (Number(t.total_distance_km) || 0),
          0
        );
        const activeTrips = (trips ?? []).filter((t: any) => t.status === "active").length;

        const { count: claimsApprovedCount } = await supabaseAdmin
          .from("claims")
          .select("id", { count: "exact", head: true })
          .eq("user_id", emp.id)
          .eq("status", "approved");

        const { count: claimsRejectedCount } = await supabaseAdmin
          .from("claims")
          .select("id", { count: "exact", head: true })
          .eq("user_id", emp.id)
          .eq("status", "rejected");

        let status: "traveling" | "idle" | "offline" = "idle";
        if (activeTrips > 0) status = "traveling";

        return {
          id: emp.id,
          name: emp.full_name,
          email: emp.email,
          designation: emp.role,
          managerName: req.user!.full_name,
          status,
          activeTrips,
          weeklyTrips,
          weeklyDistanceKm: Math.round(weeklyDistanceKm * 100) / 100,
          claimsApproved: claimsApprovedCount ?? 0,
          claimsRejected: claimsRejectedCount ?? 0,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: GET /api/employees/all ───────────────────────────────────────────
// IMPORTANT: must be registered BEFORE /:id to avoid route shadowing

router.get("/all", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, rate_per_km, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("Failed to fetch users", 500);
    res.json({ success: true, data: users ?? [] });
  } catch (err) { next(err); }
});

// ─── ADMIN: POST /api/employees/create ───────────────────────────────────────
// IMPORTANT: must be registered BEFORE /:id

const CreateUserSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN", "ACCOUNTANT"]),
  rate_per_km: z.number().min(0).max(500).optional(),
});

router.post("/create", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors.map(e => e.message).join(", "), 400);

    const { full_name, email, password, role, rate_per_km } = parsed.data;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError || !authData.user) {
      throw new AppError(authError?.message ?? "Failed to create auth user", 400);
    }

    const { data: user, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        rate_per_km: rate_per_km ?? 10.00,
        is_active: true,
      }, { onConflict: "id" })
      .select()
      .single();

    if (dbError) throw new AppError("User created in auth but DB insert failed", 500);

    logger.info("Admin created user", { createdBy: req.user!.id, newUserId: authData.user.id, role });
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ─── ADMIN: GET /api/employees/assignments ────────────────────────────────────
// IMPORTANT: must be registered BEFORE /:id

router.get("/assignments", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_manager_assignments")
      .select(`
        id,
        active,
        assigned_at,
        employee:employee_id(id, full_name, email, role),
        manager:manager_id(id, full_name, email, role)
      `)
      .eq("active", true)
      .order("assigned_at", { ascending: false });

    if (error) throw new AppError("Failed to fetch assignments", 500);
    res.json({ success: true, data: data ?? [] });
  } catch (err) { next(err); }
});

// ─── ADMIN: POST /api/employees/assignments ───────────────────────────────────
// IMPORTANT: must be registered BEFORE /:id

const AssignSchema = z.object({
  employee_id: z.string().uuid(),
  manager_id: z.string().uuid(),
});

router.post("/assignments", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AssignSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("employee_id and manager_id (UUIDs) required", 400);

    await supabaseAdmin
      .from("employee_manager_assignments")
      .update({ active: false } as any)
      .eq("employee_id", parsed.data.employee_id)
      .eq("active", true);

    const { data, error } = await supabaseAdmin
      .from("employee_manager_assignments")
      .insert({
        employee_id: parsed.data.employee_id,
        manager_id: parsed.data.manager_id,
        active: true,
      })
      .select()
      .single();

    if (error) throw new AppError("Failed to create assignment", 500);
    logger.info("Admin created assignment", { ...parsed.data, adminId: req.user!.id });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── ADMIN: DELETE /api/employees/assignments/:id ─────────────────────────────
// IMPORTANT: must be registered BEFORE /:id

router.delete("/assignments/:id", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabaseAdmin
      .from("employee_manager_assignments")
      .update({ active: false } as any)
      .eq("id", req.params.id);

    if (error) throw new AppError("Failed to remove assignment", 500);
    logger.info("Admin removed assignment", { assignmentId: req.params.id, adminId: req.user!.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── GET /api/employees/:id/stats ────────────────────────────────────────────

router.get("/:id/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.params.id;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: trips } = await supabaseAdmin
      .from("trips")
      .select("total_distance_km, total_duration_seconds, started_at")
      .eq("user_id", employeeId)
      .eq("status", "completed")
      .gte("started_at", weekAgo);

    const { data: claims } = await supabaseAdmin
      .from("claims")
      .select("amount_inr, status")
      .eq("user_id", employeeId);

    const weeklyDistance = (trips ?? []).reduce(
      (sum: number, t: any) => sum + (Number(t.total_distance_km) || 0),
      0
    );
    const weeklyDuration = (trips ?? []).reduce(
      (sum: number, t: any) => sum + (Number(t.total_duration_seconds) || 0),
      0
    );

    const pendingAmount = (claims ?? [])
      .filter((c: any) => c.status === "pending")
      .reduce((sum: number, c: any) => sum + Number(c.amount_inr), 0);

    const approvedAmount = (claims ?? [])
      .filter((c: any) => c.status === "approved")
      .reduce((sum: number, c: any) => sum + Number(c.amount_inr), 0);

    res.json({
      success: true,
      data: {
        weeklyTrips: (trips ?? []).length,
        weeklyDistanceKm: Math.round(weeklyDistance * 100) / 100,
        weeklyDurationSeconds: weeklyDuration,
        totalClaimsPending: pendingAmount,
        totalClaimsApproved: approvedAmount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/employees/:id ───────────────────────────────────────────────────
// NOTE: This MUST remain after all static routes (/all, /create, /assignments)
//       to avoid Express matching those paths as :id param values.

router.get("/:id", requireRole("MANAGER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.params.id;

    const { data: employee, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, rate_per_km, is_active, created_at")
      .eq("id", employeeId)
      .single();

    if (error || !employee) {
      throw new AppError("Employee not found", 404);
    }

    const { data: trips } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("user_id", employeeId)
      .order("started_at", { ascending: false })
      .limit(20);

    const { data: claims } = await supabaseAdmin
      .from("claims")
      .select("*")
      .eq("user_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklyTrips = (trips ?? []).filter(
      (t: any) => new Date(t.started_at) >= new Date(weekAgo)
    );
    const weeklyDistanceKm = weeklyTrips.reduce(
      (sum: number, t: any) => sum + (Number(t.total_distance_km) || 0),
      0
    );

    res.json({
      success: true,
      data: {
        employee,
        trips: trips ?? [],
        claims: claims ?? [],
        stats: {
          weeklyTrips: weeklyTrips.length,
          weeklyDistanceKm: Math.round(weeklyDistanceKm * 100) / 100,
          totalTrips: (trips ?? []).length,
          pendingClaims: (claims ?? []).filter((c: any) => c.status === "pending").length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN: PATCH /api/employees/:id ─────────────────────────────────────────

const UpdateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN", "ACCOUNTANT"]).optional(),
  rate_per_km: z.number().min(0).max(500).optional(),
  is_active: z.boolean().optional(),
});

router.patch("/:id", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors.map(e => e.message).join(", "), 400);

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update({ ...parsed.data, updated_at: new Date().toISOString() } as any)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error || !user) throw new AppError("Failed to update user", 500);
    logger.info("Admin updated user", { adminId: req.user!.id, targetId: req.params.id });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ─── ADMIN: DELETE /api/employees/:id/deactivate ─────────────────────────────

router.delete("/:id/deactivate", requireRole("ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .update({ is_active: false } as any)
      .eq("id", req.params.id);

    if (error) throw new AppError("Failed to deactivate user", 500);
    logger.info("Admin deactivated user", { adminId: req.user!.id, targetId: req.params.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
