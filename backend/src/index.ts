import "dotenv/config";
import http from "http";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter";
import { AppError } from "./utils/AppError";
import logger from "./utils/logger";
import { initSocketServer } from "./config/socket";
import { registerLocationSocket } from "./modules/locations/locationSocket";
import authRouter from "./modules/auth/auth.router";
import tripsRouter from "./modules/trips/trips.router";
import locationsRouter from "./modules/locations/locations.router";
import claimsRouter from "./modules/claims/claims.router";
import employeesRouter from "./modules/employees/employees.router";
import dashboardRouter from "./modules/dashboard/dashboard.router";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);

function isPrivateDevOrigin(origin: string): boolean {
  try {
    const parsedOrigin = new URL(origin);
    const host = parsedOrigin.hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("10.") ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== "production" && origin.startsWith("exp://")) {
    return true;
  }

  if (process.env.NODE_ENV !== "production" && isPrivateDevOrigin(origin)) {
    return true;
  }

  return false;
}

// ─── Global Middleware ───────────────────────────────────────────────────────

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()) ?? ["http://localhost:5173"];
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin ?? undefined, corsOrigins));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/auth", authRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/dashboard", dashboardRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", 404));
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  logger.error("Unhandled error", { message: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ─── Create HTTP Server + Socket.IO ──────────────────────────────────────────

const httpServer = http.createServer(app);
const io = initSocketServer(httpServer, corsOrigins);
registerLocationSocket(io);

// ─── Start Server ────────────────────────────────────────────────────────────

httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info(`FT-TRMS API running on http://0.0.0.0:${PORT}`);
  logger.info(`CORS origins: ${corsOrigins.join(", ")}`);
  logger.info("Socket.IO ready for connections");
});

export default app;
