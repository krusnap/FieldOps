import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Factory that returns an Express middleware checking whether the
 * authenticated user's role is included in the allowed list.
 *
 * Must be used AFTER the `authenticate` middleware so that `req.user` exists.
 *
 * @example
 *   router.get("/admin-only", authenticate, requireRole("ADMIN"), handler);
 *   router.get("/multi", authenticate, requireRole("MANAGER", "ADMIN"), handler);
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Unauthorized – authenticate first", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Insufficient permissions. Required role: ${allowedRoles.join(" | ")}`,
          403
        )
      );
    }

    next();
  };
}
