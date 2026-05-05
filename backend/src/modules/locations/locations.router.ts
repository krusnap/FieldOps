import { Router, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { z } from "zod";

const router = Router();

router.use(authenticate);

// ─── Validation ──────────────────────────────────────────────────────────────

const LocationPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  altitude: z.number().optional().nullable(),
  recorded_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
});

const BatchSchema = z.object({
  trip_id: z.string().uuid("Valid trip_id is required"),
  points: z.array(LocationPointSchema).min(1, "At least one location point is required").max(100),
});

// ─── POST /api/locations/batch ───────────────────────────────────────────────

router.post("/batch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const parsed = BatchSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new AppError(message, 400);
    }

    const { trip_id, points } = parsed.data;

    // Verify the trip belongs to this user and is active
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("id, user_id, status")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      throw new AppError("Trip not found", 404);
    }

    if (trip.user_id !== userId) {
      throw new AppError("Trip does not belong to you", 403);
    }

    if (trip.status !== "active") {
      throw new AppError(`Cannot add locations to a ${trip.status} trip`, 400);
    }

    // Prepare rows for batch insert
    const rows = points.map((point) => ({
      trip_id,
      user_id: userId,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy ?? null,
      speed: point.speed ?? null,
      altitude: point.altitude ?? null,
      recorded_at: point.recorded_at,
    }));

    const { error: insertError } = await supabaseAdmin.from("locations").insert(rows);

    if (insertError) {
      logger.error("Failed to insert location batch", { error: insertError.message, tripId: trip_id });
      throw new AppError("Failed to save location data", 500);
    }

    logger.debug("Location batch saved", { tripId: trip_id, count: points.length });

    res.json({
      success: true,
      data: { inserted: points.length },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/locations/:tripId ──────────────────────────────────────────────

router.get("/:tripId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tripId = req.params.tripId;

    // Check trip exists and user has access
    const { data: trip } = await supabaseAdmin
      .from("trips")
      .select("id, user_id")
      .eq("id", tripId)
      .single();

    if (!trip) {
      throw new AppError("Trip not found", 404);
    }

    if (trip.user_id !== req.user!.id && !["MANAGER", "ADMIN"].includes(req.user!.role)) {
      throw new AppError("Access denied", 403);
    }

    const { data: locations, error } = await supabaseAdmin
      .from("locations")
      .select("latitude, longitude, accuracy, speed, altitude, recorded_at")
      .eq("trip_id", tripId)
      .order("recorded_at", { ascending: true });

    if (error) {
      throw new AppError("Failed to fetch locations", 500);
    }

    res.json({ success: true, data: locations ?? [] });
  } catch (err) {
    next(err);
  }
});

export default router;
