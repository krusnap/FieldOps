import { Router, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";

const router = Router();

router.use(authenticate);

// ─── GET /api/dashboard/employee ─────────────────────────────────────────────

router.get("/employee", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Today's completed trips
    const { data: todayTrips } = await supabaseAdmin
      .from("trips")
      .select("total_distance_km, total_duration_seconds, status")
      .eq("user_id", userId)
      .gte("started_at", todayIso);

    const todayDistanceKm = (todayTrips ?? []).reduce(
      (sum: number, t: any) => sum + (Number(t.total_distance_km) || 0),
      0
    );

    // Active trip check
    const { data: activeTrip } = await supabaseAdmin
      .from("trips")
      .select("id, status, started_at, total_distance_km")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .limit(1)
      .single();

    // Pending claims amount
    const { data: pendingClaims } = await supabaseAdmin
      .from("claims")
      .select("amount_inr")
      .eq("user_id", userId)
      .eq("status", "pending");

    const pendingAmountInr = (pendingClaims ?? []).reduce(
      (sum: number, c: any) => sum + Number(c.amount_inr),
      0
    );

    // Weekly compliance: (days with trips / 5 working days) * 100
    const { data: weekTrips } = await supabaseAdmin
      .from("trips")
      .select("started_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("started_at", weekAgo);

    const uniqueDays = new Set(
      (weekTrips ?? []).map((t: any) => new Date(t.started_at).toISOString().slice(0, 10))
    );
    const weeklyCompliance = `${Math.min(Math.round((uniqueDays.size / 5) * 100), 100)}%`;

    // Total claims count
    const { count: totalClaims } = await supabaseAdmin
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    res.json({
      success: true,
      data: {
        todayDistanceKm: Math.round(todayDistanceKm * 100) / 100,
        activeTrip: activeTrip ?? null,
        pendingClaimAmountInr: Math.round(pendingAmountInr * 100) / 100,
        weeklyCompliance,
        todayTrips: (todayTrips ?? []).length,
        totalClaims: totalClaims ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/dashboard/manager ──────────────────────────────────────────────

router.get(
  "/manager",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const managerId = req.user!.id;
      const role = req.user!.role;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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

      const totalEmployees = employeeIds.length;

      // Pending claims count
      let pendingClaims = 0;
      let approvedClaims = 0;
      let weeklyTravelKm = 0;

      if (employeeIds.length > 0) {
        const { count: pending } = await supabaseAdmin
          .from("claims")
          .select("id", { count: "exact", head: true })
          .in("user_id", employeeIds)
          .eq("status", "pending");

        pendingClaims = pending ?? 0;

        const { count: approved } = await supabaseAdmin
          .from("claims")
          .select("id", { count: "exact", head: true })
          .in("user_id", employeeIds)
          .eq("status", "approved");

        approvedClaims = approved ?? 0;

        // Weekly travel across all employees
        const { data: weekTrips } = await supabaseAdmin
          .from("trips")
          .select("total_distance_km")
          .in("user_id", employeeIds)
          .eq("status", "completed")
          .gte("started_at", weekAgo);

        weeklyTravelKm = (weekTrips ?? []).reduce(
          (sum: number, t: any) => sum + (Number(t.total_distance_km) || 0),
          0
        );
      }

      res.json({
        success: true,
        data: {
          totalEmployees,
          pendingClaims,
          approvedClaims,
          weeklyTravelSummaryKm: Math.round(weeklyTravelKm * 100) / 100,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
