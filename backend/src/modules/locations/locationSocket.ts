import { Server as SocketIOServer } from "socket.io";
import { supabaseAdmin } from "../../config/supabase";
import logger from "../../utils/logger";
import { z } from "zod";

const LocationUpdateSchema = z.object({
  trip_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  altitude: z.number().optional().nullable(),
  recorded_at: z.string(),
});

// In-memory buffer for batch DB writes
interface BufferedPoint {
  trip_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  altitude: number | null;
  recorded_at: string;
}

const locationBuffer: BufferedPoint[] = [];
const FLUSH_INTERVAL_MS = 5000;

/**
 * Flush buffered location points to the database.
 */
async function flushBuffer(): Promise<void> {
  if (locationBuffer.length === 0) return;

  const batch = locationBuffer.splice(0, locationBuffer.length);

  try {
    const { error } = await supabaseAdmin.from("locations").insert(batch);

    if (error) {
      logger.error("Failed to flush location buffer", {
        error: error.message,
        count: batch.length,
      });
      // Put failed items back
      locationBuffer.unshift(...batch);
    } else {
      logger.debug("Location buffer flushed", { count: batch.length });
    }
  } catch (err) {
    logger.error("Location buffer flush exception", { error: (err as Error).message });
    locationBuffer.unshift(...batch);
  }
}

/**
 * Register location tracking socket handlers.
 */
export function registerLocationSocket(io: SocketIOServer): void {
  // Start periodic flush
  setInterval(() => {
    void flushBuffer();
  }, FLUSH_INTERVAL_MS);

  io.on("connection", (socket) => {
    const userId = (socket as any).userId as string;

    // ─── location:update ──────────────────────────────────────────────
    socket.on("location:update", (payload: unknown) => {
      const parsed = LocationUpdateSchema.safeParse(payload);

      if (!parsed.success) {
        socket.emit("location:error", {
          message: "Invalid location payload",
          details: parsed.error.errors,
        });
        return;
      }

      const data = parsed.data;

      // Basic mock GPS detection: speed > 200 km/h (~55 m/s)
      if (data.speed != null && data.speed > 55) {
        socket.emit("location:error", { message: "Suspicious speed detected" });
        return;
      }

      // Join trip room
      socket.join(`trip:${data.trip_id}`);

      // Buffer for batch DB write
      locationBuffer.push({
        trip_id: data.trip_id,
        user_id: userId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy ?? null,
        speed: data.speed ?? null,
        altitude: data.altitude ?? null,
        recorded_at: data.recorded_at,
      });

      // Broadcast to managers
      io.to("managers").emit("location:broadcast", {
        user_id: userId,
        user_name: (socket as any).userName,
        trip_id: data.trip_id,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        recorded_at: data.recorded_at,
      });
    });

    // ─── trip:started ─────────────────────────────────────────────────
    socket.on("trip:started", (payload: { trip_id: string }) => {
      socket.join(`trip:${payload.trip_id}`);
      io.to("managers").emit("trip:started", {
        user_id: userId,
        user_name: (socket as any).userName,
        trip_id: payload.trip_id,
      });
    });

    // ─── trip:ended ───────────────────────────────────────────────────
    socket.on("trip:ended", (payload: { trip_id: string; distance_km: number }) => {
      socket.leave(`trip:${payload.trip_id}`);
      io.to("managers").emit("trip:ended", {
        user_id: userId,
        user_name: (socket as any).userName,
        trip_id: payload.trip_id,
        distance_km: payload.distance_km,
      });
    });
  });

  logger.info("Location socket handlers registered");
}
