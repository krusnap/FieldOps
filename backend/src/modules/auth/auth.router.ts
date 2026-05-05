import { Router, Request, Response, NextFunction } from "express";
import { supabaseAnon, supabaseAdmin } from "../../config/supabase";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter } from "../../middleware/rateLimiter";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { z } from "zod";

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const RefreshSchema = z.object({
  refresh_token: z.string().min(1, "refresh_token is required"),
});

// ─── POST /auth/login ────────────────────────────────────────────────────────

router.post("/login", authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      throw new AppError(message, 400);
    }

    const { email, password } = parsed.data;

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      logger.warn("Login failed", { email, error: error?.message });
      throw new AppError("Invalid email or password", 401);
    }

    const { session, user } = data;

    // Try to fetch the profile from the users table
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, email, role, full_name, rate_per_km")
      .eq("id", user.id)
      .single();

    const userResponse = profile
      ? {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
          rate_per_km: profile.rate_per_km,
        }
      : {
          id: user.id,
          email: user.email ?? email,
          role: (user.user_metadata?.role as string) ?? "EMPLOYEE",
          full_name: (user.user_metadata?.full_name as string) ?? email.split("@")[0],
          rate_per_km: null,
        };

    logger.info("Login success", { userId: user.id, email });

    res.json({
      success: true,
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        user: userResponse,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/refresh ──────────────────────────────────────────────────────

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("refresh_token is required", 400);
    }

    const { refresh_token } = parsed.data;

    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });

    if (error || !data.session) {
      logger.warn("Refresh token failed", { error: error?.message });
      throw new AppError("Invalid or expired refresh token", 401);
    }

    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /auth/logout ──────────────────────────────────────────────────────

router.post("/logout", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the token to sign out the specific session
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      // Use admin to sign out the session by user ID
      await supabaseAdmin.auth.admin.signOut(token);
    }

    logger.info("Logout", { userId: req.user?.id });

    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (err) {
    // Even if sign-out fails server-side, the client should clear tokens
    logger.warn("Logout error (non-critical)", { error: (err as Error).message });
    res.json({ success: true, data: { message: "Logged out" } });
  }
});

// ─── GET /auth/me ────────────────────────────────────────────────────────────

router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

export default router;
