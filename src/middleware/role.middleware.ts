import type { Request, Response, NextFunction } from "express";

// allowedRoles can be a single role or array
export function allowRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // we expect req.user to be populated by auth middleware
    const user = (req as any).user;
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
