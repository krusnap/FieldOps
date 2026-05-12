import { Router, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { AppError } from "../../utils/AppError";
import { calculateDistance } from "../../utils/haversine";
import logger from "../../utils/logger";
import { z } from "zod";
import { syncBundleTotals } from "../claims/bundles.router";

const router = Router();

// All trip routes require authentication
router.use(authenticate);

// ─── POST /api/trips/start ───────────────────────────────────────────────────

const StartTripSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post("/start", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = StartTripSchema.safeParse(req.body);

    // Check for existing active/paused trip
    const { data: existing } = await supabaseAdmin
      .from("trips")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .limit(1)
      .single();

    if (existing) {
      throw new AppError(
        `You already have an ${existing.status} trip (${existing.id}). End it before starting a new one.`,
        409
      );
    }

    const insertData: Record<string, unknown> = {
      user_id: userId,
      status: "active",
      started_at: new Date().toISOString(),
    };

    if (body.success && body.data.latitude && body.data.longitude) {
      insertData.start_latitude = body.data.latitude;
      insertData.start_longitude = body.data.longitude;
    }

    const { data: trip, error } = await supabaseAdmin
      .from("trips")
      .insert(insertData)
      .select()
      .single();

    if (error || !trip) {
      logger.error("Failed to create trip", { error: error?.message });
      throw new AppError("Failed to start trip", 500);
    }

    logger.info("Trip started", { tripId: trip.id, userId });

    res.status(201).json({
      success: true,
      data: trip,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/trips/:id/pause ──────────────────────────────────────────────

router.patch("/:id/pause", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tripId = req.params.id;

    const { data: trip, error: fetchError } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !trip) {
      throw new AppError("Trip not found or not owned by you", 404);
    }

    if (trip.status !== "active") {
      throw new AppError(`Cannot pause a trip with status "${trip.status}"`, 400);
    }

    const { data: updated, error } = await supabaseAdmin
      .from("trips")
      .update({
        status: "paused",
        paused_at: new Date().toISOString(),
      })
      .eq("id", tripId)
      .select()
      .single();

    if (error) {
      throw new AppError("Failed to pause trip", 500);
    }

    logger.info("Trip paused", { tripId, userId });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/trips/:id/resume ─────────────────────────────────────────────

router.patch("/:id/resume", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tripId = req.params.id;

    const { data: trip, error: fetchError } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !trip) {
      throw new AppError("Trip not found or not owned by you", 404);
    }

    if (trip.status !== "paused") {
      throw new AppError(`Cannot resume a trip with status "${trip.status}"`, 400);
    }

    // Calculate how long the trip was paused
    let additionalPauseSeconds = 0;
    if (trip.paused_at) {
      additionalPauseSeconds = Math.round(
        (Date.now() - new Date(trip.paused_at).getTime()) / 1000
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("trips")
      .update({
        status: "active",
        paused_at: null,
        pause_duration_seconds: (trip.pause_duration_seconds ?? 0) + additionalPauseSeconds,
      })
      .eq("id", tripId)
      .select()
      .single();

    if (error) {
      throw new AppError("Failed to resume trip", 500);
    }

    logger.info("Trip resumed", { tripId, userId, additionalPauseSeconds });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/trips/:id/end ─────────────────────────────────────────────────

router.post("/:id/end", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tripId = req.params.id;

    const { data: trip, error: fetchError } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !trip) {
      throw new AppError("Trip not found or not owned by you", 404);
    }

    if (trip.status !== "active" && trip.status !== "paused") {
      throw new AppError(`Cannot end a trip with status "${trip.status}"`, 400);
    }

    // If currently paused, accumulate final pause duration
    let finalPauseDuration = trip.pause_duration_seconds ?? 0;
    if (trip.status === "paused" && trip.paused_at) {
      finalPauseDuration += Math.round(
        (Date.now() - new Date(trip.paused_at).getTime()) / 1000
      );
    }

    // Fetch all location points for this trip
    const { data: locations, error: locError } = await supabaseAdmin
      .from("locations")
      .select("latitude, longitude, recorded_at")
      .eq("trip_id", tripId)
      .order("recorded_at", { ascending: true });

    if (locError) {
      logger.error("Failed to fetch locations for distance calc", { error: locError.message });
    }

    const points = (locations ?? []).map((loc: any) => ({
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      recorded_at: loc.recorded_at,
    }));

    const distResult = calculateDistance(points);

    const endedAt = new Date().toISOString();
    const totalDuration = Math.round(
      (new Date(endedAt).getTime() - new Date(trip.started_at).getTime()) / 1000
    );

    // Get end location from last point
    const lastPoint = points.length > 0 ? points[points.length - 1] : null;

    const updateData: Record<string, unknown> = {
      status: "completed",
      ended_at: endedAt,
      total_distance_km: distResult.totalKm,
      total_duration_seconds: totalDuration,
      pause_duration_seconds: finalPauseDuration,
      avg_speed_kmh: distResult.avgSpeedKmh,
      paused_at: null,
    };

    if (lastPoint) {
      updateData.end_latitude = lastPoint.latitude;
      updateData.end_longitude = lastPoint.longitude;
    }

    const { data: updatedTrip, error: updateError } = await supabaseAdmin
      .from("trips")
      .update(updateData)
      .eq("id", tripId)
      .select()
      .single();

    if (updateError) {
      throw new AppError("Failed to end trip", 500);
    }

    // ─── Auto-create DRAFT claim + bundle (compensating pattern) ────────────
    // The trip is already marked complete. Steps below are best-effort;
    // failures are logged per-step so nothing is silently lost.
    let claim = null;
    let claimSynced = false;
    let bundleSynced = false;

    if (distResult.totalKm > 0) {
      const ratePerKm = req.user!.rate_per_km ?? 10;
      const amountInr = Math.round(distResult.totalKm * ratePerKm * 100) / 100;
      const claimDate = trip.started_at.slice(0, 10);

      // Step 1: Upsert daily bundle
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from("daily_claim_bundles")
        .upsert(
          { user_id: userId, claim_date: claimDate },
          { onConflict: "user_id,claim_date", ignoreDuplicates: false }
        )
        .select()
        .single();

      if (bundleError || !bundle) {
        logger.error("COMPENSATE: Failed to upsert daily bundle — claim NOT created", {
          tripId, userId, error: bundleError?.message
        });
      } else {
        bundleSynced = true;

        // Step 2: Insert draft claim
        const { data: newClaim, error: claimError } = await supabaseAdmin
          .from("claims")
          .insert({
            trip_id: tripId,
            user_id: userId,
            bundle_id: bundle.id,
            amount_inr: amountInr,
            rate_per_km: ratePerKm,
            distance_km: distResult.totalKm,
            status: "draft",
            category: "Trip Reimbursement",
          })
          .select()
          .single();

        if (claimError) {
          logger.error("COMPENSATE: Failed to create draft claim — bundle exists without claim", {
            tripId, bundleId: bundle.id, userId, error: claimError.message
          });
        } else {
          claim = newClaim;
          claimSynced = true;

          // Step 3: Sync bundle totals (non-blocking, already idempotent)
          try {
            await syncBundleTotals(bundle.id);
          } catch (syncErr) {
            logger.warn("COMPENSATE: syncBundleTotals failed — totals will refresh on next load", {
              bundleId: bundle.id, error: (syncErr as Error).message
            });
          }
        }
      }
    }

    logger.info("Trip ended", {
      tripId, userId,
      distanceKm: distResult.totalKm,
      durationSec: totalDuration,
      claimCreated: claimSynced,
      bundleCreated: bundleSynced,
    });

    res.json({
      success: true,
      data: {
        trip: updatedTrip,
        distance: distResult,
        claim,
        claimSynced,
        bundleSynced,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/trips/active ───────────────────────────────────────────────────

router.get("/active", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const { data: trip } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    res.json({ success: true, data: trip ?? null });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/trips/history ──────────────────────────────────────────────────

router.get("/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const { data: trips, error, count } = await supabaseAdmin
      .from("trips")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("ended_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError("Failed to fetch trip history", 500);
    }

    res.json({
      success: true,
      data: trips ?? [],
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

// ─── GET /api/trips/employee/:userId (Manager) ──────────────────────────────

router.get(
  "/employee/:userId",
  requireRole("MANAGER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.userId;

      const { data: trips, error } = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("user_id", targetUserId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new AppError("Failed to fetch employee trips", 500);
      }

      res.json({ success: true, data: trips ?? [] });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/trips/:id ─────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.id;

    const { data: trip, error } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (error || !trip) {
      throw new AppError("Trip not found", 404);
    }

    // Check access: own trip or manager/admin
    if (trip.user_id !== req.user!.id && !["MANAGER", "ADMIN"].includes(req.user!.role)) {
      throw new AppError("Access denied", 403);
    }

    // Fetch locations for this trip
    const { data: locations } = await supabaseAdmin
      .from("locations")
      .select("latitude, longitude, accuracy, speed, altitude, recorded_at")
      .eq("trip_id", tripId)
      .order("recorded_at", { ascending: true });

    res.json({
      success: true,
      data: {
        ...trip,
        locations: locations ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
