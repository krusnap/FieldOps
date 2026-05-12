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

    // Assigned manager
    const { data: assignment } = await supabaseAdmin
      .from("employee_manager_assignments")
      .select("users!employee_manager_assignments_manager_id_fkey(id, full_name, email)")
      .eq("employee_id", userId)
      .eq("active", true)
      .limit(1)
      .single();

    const assignedManager = (assignment as any)?.users ?? null;

    // User profile (authoritative values from public.users, not user_metadata)
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("full_name, rate_per_km, email")
      .eq("id", userId)
      .single();

    res.json({
      success: true,
      data: {
        todayDistanceKm: Math.round(todayDistanceKm * 100) / 100,
        activeTrip: activeTrip ?? null,
        pendingClaimAmountInr: Math.round(pendingAmountInr * 100) / 100,
        weeklyCompliance,
        todayTrips: (todayTrips ?? []).length,
        totalClaims: totalClaims ?? 0,
        assignedManager,
        // Profile fields — use these instead of stale user_metadata
        profile: {
          full_name: profile?.full_name ?? null,
          rate_per_km: profile?.rate_per_km ?? null,
          email: profile?.email ?? null,
        },
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

// ─── GET /api/dashboard/admin ─────────────────────────────────────────────────

router.get(
  "/admin",
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      // User counts by role
      const { data: usersByRole } = await supabaseAdmin
        .from("users")
        .select("role, is_active");

      const allUsers = usersByRole ?? [];
      const totalUsers = allUsers.length;
      const totalEmployees = allUsers.filter((u: any) => u.role === "EMPLOYEE" && u.is_active).length;
      const totalManagers = allUsers.filter((u: any) => u.role === "MANAGER" && u.is_active).length;
      const totalAccountants = allUsers.filter((u: any) => u.role === "ACCOUNTANT" && u.is_active).length;
      const inactiveUsers = allUsers.filter((u: any) => !u.is_active).length;

      // Trip counts
      const { count: totalTrips } = await supabaseAdmin
        .from("trips")
        .select("id", { count: "exact", head: true });

      const { count: todayTrips } = await supabaseAdmin
        .from("trips")
        .select("id", { count: "exact", head: true })
        .gte("started_at", todayIso);

      // Bundle counts and amounts
      const { data: bundleSummary } = await supabaseAdmin
        .from("daily_claim_bundles")
        .select("status, total_amount_inr, total_distance_km, claim_date, users(full_name)")
        .order("claim_date", { ascending: false });

      const bundles = bundleSummary ?? [];
      const pendingBundles = bundles.filter((b: any) => b.status === "pending").length;
      const approvedBundles = bundles.filter((b: any) => b.status === "approved").length;
      const rejectedBundles = bundles.filter((b: any) => b.status === "rejected").length;

      const totalApprovedAmountInr = bundles
        .filter((b: any) => b.status === "approved")
        .reduce((sum: number, b: any) => sum + Number(b.total_amount_inr), 0);

      const totalPendingAmountInr = bundles
        .filter((b: any) => b.status === "pending")
        .reduce((sum: number, b: any) => sum + Number(b.total_amount_inr), 0);

      // Recent approved bundles (last 5)
      const recentApproved = bundles
        .filter((b: any) => b.status === "approved")
        .slice(0, 5)
        .map((b: any) => ({
          employeeName: (b.users as any)?.full_name ?? "Unknown",
          date: b.claim_date,
          amountInr: Number(b.total_amount_inr),
          distanceKm: Number(b.total_distance_km),
          status: b.status,
        }));

      // Travel trend: last 7 days trip count
      const { data: weekTrips } = await supabaseAdmin
        .from("trips")
        .select("started_at, total_distance_km")
        .eq("status", "completed")
        .gte("started_at", weekAgo)
        .order("started_at", { ascending: true });

      const trendMap: Record<string, { trips: number; km: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        trendMap[key] = { trips: 0, km: 0 };
      }
      for (const t of weekTrips ?? []) {
        const key = new Date(t.started_at).toISOString().slice(0, 10);
        if (trendMap[key]) {
          trendMap[key].trips += 1;
          trendMap[key].km += Number(t.total_distance_km) || 0;
        }
      }
      const travelTrendWeek = Object.entries(trendMap).map(([date, v]) => ({
        label: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
        date,
        value: Math.round(v.km * 10) / 10,
        trips: v.trips,
      }));

      res.json({
        success: true,
        data: {
          totalUsers,
          totalEmployees,
          totalManagers,
          totalAccountants,
          inactiveUsers,
          totalTrips: totalTrips ?? 0,
          todayTrips: todayTrips ?? 0,
          pendingBundles,
          approvedBundles,
          rejectedBundles,
          totalApprovedAmountInr: Math.round(totalApprovedAmountInr * 100) / 100,
          totalPendingAmountInr: Math.round(totalPendingAmountInr * 100) / 100,
          recentApproved,
          travelTrendWeek,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/dashboard/accountant ───────────────────────────────────────────

router.get(
  "/accountant",
  requireRole("ACCOUNTANT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // All bundles with user info
      const { data: bundleRows } = await supabaseAdmin
        .from("daily_claim_bundles")
        .select("id, status, total_amount_inr, total_distance_km, claim_date, trip_count, users(full_name, email)")
        .order("claim_date", { ascending: false });

      const bundles = bundleRows ?? [];

      const approved = bundles.filter((b: any) => b.status === "approved");
      const pending = bundles.filter((b: any) => b.status === "pending");
      const rejected = bundles.filter((b: any) => b.status === "rejected");

      const sum = (arr: any[], field: string) =>
        arr.reduce((s: number, b: any) => s + Number(b[field] || 0), 0);

      // Recent 8 approved bundles for table
      const recentApproved = approved.slice(0, 8).map((b: any) => ({
        id: b.id,
        employeeName: (b.users as any)?.full_name ?? "Unknown",
        date: b.claim_date,
        amountInr: Number(b.total_amount_inr),
        distanceKm: Number(b.total_distance_km),
        tripCount: b.trip_count,
        status: b.status,
      }));

      // All recent bundles for the full table (last 20)
      const recentAll = bundles.slice(0, 20).map((b: any) => ({
        id: b.id,
        employeeName: (b.users as any)?.full_name ?? "Unknown",
        date: b.claim_date,
        amountInr: Number(b.total_amount_inr),
        distanceKm: Number(b.total_distance_km),
        tripCount: b.trip_count,
        status: b.status,
      }));

      res.json({
        success: true,
        data: {
          approvedCount: approved.length,
          pendingCount: pending.length,
          rejectedCount: rejected.length,
          totalApprovedAmountInr: Math.round(sum(approved, "total_amount_inr") * 100) / 100,
          totalPendingAmountInr: Math.round(sum(pending, "total_amount_inr") * 100) / 100,
          totalRejectedAmountInr: Math.round(sum(rejected, "total_amount_inr") * 100) / 100,
          approvedDistanceKm: Math.round(sum(approved, "total_distance_km") * 10) / 10,
          pendingDistanceKm: Math.round(sum(pending, "total_distance_km") * 10) / 10,
          rejectedDistanceKm: Math.round(sum(rejected, "total_distance_km") * 10) / 10,
          recentApproved,
          recentAll,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
