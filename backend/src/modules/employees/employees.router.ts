import { Router, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";

const router = Router();

router.use(authenticate);
router.use(requireRole("MANAGER", "ADMIN"));

// ─── GET /api/employees ──────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    const role = req.user!.role;

    let employeeIds: string[] = [];

    if (role === "ADMIN") {
      // Admin sees all employees
      const { data: allUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("role", "EMPLOYEE")
        .eq("is_active", true);

      employeeIds = (allUsers ?? []).map((u: any) => u.id);
    } else {
      // Manager sees only assigned employees
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

    // Fetch employee profiles
    const { data: employees, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, rate_per_km, is_active, created_at")
      .in("id", employeeIds)
      .eq("is_active", true);

    if (error) {
      throw new AppError("Failed to fetch employees", 500);
    }

    // Enrich with trip/claim stats
    const enriched = await Promise.all(
      (employees ?? []).map(async (emp: any) => {
        // Get trip stats for this week
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

        // Get claim stats
        const { data: claimsApproved } = await supabaseAdmin
          .from("claims")
          .select("id", { count: "exact", head: true })
          .eq("user_id", emp.id)
          .eq("status", "approved");

        const { data: claimsRejected } = await supabaseAdmin
          .from("claims")
          .select("id", { count: "exact", head: true })
          .eq("user_id", emp.id)
          .eq("status", "rejected");

        // Determine current status
        let status: "traveling" | "idle" | "offline" = "idle";
        if (activeTrips > 0) {
          status = "traveling";
        }

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
          claimsApproved: (claimsApproved as any)?.length ?? 0,
          claimsRejected: (claimsRejected as any)?.length ?? 0,
          city: "—",
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/employees/:id ─────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
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

    // Fetch recent trips
    const { data: trips } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("user_id", employeeId)
      .order("started_at", { ascending: false })
      .limit(20);

    // Fetch claims
    const { data: claims } = await supabaseAdmin
      .from("claims")
      .select("*")
      .eq("user_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Weekly stats
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

export default router;
