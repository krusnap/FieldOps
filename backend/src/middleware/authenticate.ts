import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  rate_per_km: number | null;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Express middleware that verifies the JWT from the Authorization header
 * and attaches the user profile from the users table to req.user.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Missing Authorization header", 401);
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new AppError("Malformed Authorization header. Expected: Bearer <token>", 401);
    }

    const token = parts[1];

    // Verify the JWT with Supabase (service role can verify any token)
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      logger.warn("Token verification failed", { error: authError?.message });
      throw new AppError("Unauthorized – invalid or expired token", 401);
    }

    const supabaseUser = authData.user;

    // Fetch the user record from the public users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, full_name, rate_per_km")
      .eq("id", supabaseUser.id)
      .single();

    if (dbError || !dbUser) {
      // User exists in Supabase Auth but not in our users table.
      // This can happen if the user was created in Auth but the DB row wasn't inserted yet.
      // Fall back to auth metadata so login still works.
      logger.warn("User not found in users table, using auth metadata", {
        userId: supabaseUser.id,
        dbError: dbError?.message,
      });

      req.user = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        role: (supabaseUser.user_metadata?.role as string) ?? "EMPLOYEE",
        full_name: (supabaseUser.user_metadata?.full_name as string) ?? supabaseUser.email?.split("@")[0] ?? "User",
        rate_per_km: null,
      };

      return next();
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      full_name: dbUser.full_name,
      rate_per_km: dbUser.rate_per_km ?? null,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError("Unauthorized", 401));
    }
  }
}
