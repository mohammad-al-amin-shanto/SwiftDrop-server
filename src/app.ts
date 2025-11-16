// src/app.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import parcelsRouter from "./routes/parcels.routes";
import usersRouter from "./routes/users.routes";
import authRouter from "./routes/auth.routes"; // optional auth routes (login/register)
import { getDashboardSummary } from "./controllers/dashboard.controller";
import { authenticate, allowRoles } from "./middleware/auth.middleware"; // see note below

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

/**
 * Express app
 */
const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/**
 * Public / auth routes (if you have an auth router)
 * Keep auth endpoints public (login/register)
 */
if (authRouter) {
  app.use("/api/auth", authRouter);
}

/**
 * API routes
 * - parcelsRouter should handle create/list/update/cancel etc.
 * - usersRouter should handle user management (protected below)
 *
 * Note: ensure those files export a Router as default:
 *   export default router;
 */
app.use("/api/parcels", parcelsRouter);

/**
 * Protect admin user management routes with authentication + role check
 * (adjust middleware order/logic to match your implementation)
 */
app.use("/api/users", authenticate, allowRoles("admin"), usersRouter);

/**
 * Dashboard summary: allow admin/sender/receiver (example)
 */
app.get(
  "/api/dashboard/summary",
  authenticate,
  allowRoles("admin", "sender", "receiver"),
  getDashboardSummary
);

/**
 * Healthcheck
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

/**
 * Central error handler
 */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // lightweight error normalization
  const status =
    (err &&
      typeof err === "object" &&
      "status" in err &&
      Number((err as any).status)) ||
    500;
  const message =
    (err &&
      typeof err === "object" &&
      "message" in err &&
      String((err as any).message)) ||
    "Internal server error";
  // You can expand logging here (Sentry, pino, etc.)
  console.error("Server error:", err);
  res.status(status).json({ error: message });
});

/**
 * Start server if run directly (useful for local dev)
 * If you prefer starting server in separate file (bin/www), remove this block.
 */
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Server listening on http://localhost:${PORT} (env=${
        process.env.NODE_ENV || "dev"
      })`
    );
  });
}

export default app;
