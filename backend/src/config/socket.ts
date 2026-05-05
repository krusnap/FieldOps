import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { supabaseAdmin } from "./supabase";
import logger from "../utils/logger";

let io: SocketIOServer | null = null;

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

/**
 * Initialize Socket.IO server attached to the HTTP server.
 */
export function initSocketServer(httpServer: HttpServer, corsOrigins: string[]): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin ?? undefined, corsOrigins));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // JWT authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return next(new Error("Invalid or expired token"));
      }

      // Fetch user profile
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("id, email, role, full_name")
        .eq("id", data.user.id)
        .single();

      // Attach user info to socket
      (socket as any).userId = data.user.id;
      (socket as any).userRole = profile?.role ?? "EMPLOYEE";
      (socket as any).userName = profile?.full_name ?? data.user.email;

      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId as string;
    const role = (socket as any).userRole as string;

    logger.debug("Socket connected", { userId, role, socketId: socket.id });

    // Join personal room
    socket.join(`user:${userId}`);

    // Managers join a manager room for broadcasts
    if (role === "MANAGER" || role === "ADMIN") {
      socket.join("managers");
    }

    socket.on("disconnect", () => {
      logger.debug("Socket disconnected", { userId, socketId: socket.id });
    });
  });

  logger.info("Socket.IO server initialized");
  return io;
}

/**
 * Get the Socket.IO server instance.
 */
export function getIO(): SocketIOServer | null {
  return io;
}
