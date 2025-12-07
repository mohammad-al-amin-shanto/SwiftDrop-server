// src/middleware/role.middleware.ts
import type { Request, Response, NextFunction } from "express";
import type { AuthedUser } from "./auth.middleware";

// allowedRoles can be a single role or multiple
export function allowRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthedUser | undefined;

    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Not authenticated" });
    }

    if (allowedRoles.includes(user.role)) {
      return next();
    }

    return res
      .status(403)
      .json({ status: "fail", message: "Forbidden: insufficient role" });
  };
}
