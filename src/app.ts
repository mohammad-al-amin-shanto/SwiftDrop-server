/* eslint-disable @typescript-eslint/no-var-requires */
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { getDashboardSummary } from "./controllers/dashboard.controller";
import { authenticate } from "./middleware/auth.middleware";
import { allowRoles } from "./middleware/role.middleware";
import dashboardRoutes from "./routes/dashboard.routes";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

/**
 * Defensive router loader:
 * Try require(...) and return default export or module itself.
 */
function tryLoadRouter(path: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
    const mod = require(path);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (mod && (mod.default ?? mod)) as express.Router | null;
  } catch (err: any) {
    console.warn(`[app] Could not load router '${path}':`, err?.message ?? err);
    return null;
  }
}

/**
 * Load routers defensively
 */
const parcelsRouter = tryLoadRouter("./routes/parcels.routes");
const usersRouter = tryLoadRouter("./routes/users.routes");
const authRouter = tryLoadRouter("./routes/auth.routes");

/**
 * Express app
 */
const app = express();

app.use((req, _res, next) => {
  console.log(
    "Incoming Origin:",
    req.headers.origin,
    "Method:",
    req.method,
    "URL:",
    req.url
  );
  next();
});

/**
 * Allowed origins for CORS (no trailing slashes)
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://swiftdrop-client.netlify.app",
];

const defaultCorsMethods = [
  "GET",
  "HEAD",
  "PUT",
  "PATCH",
  "POST",
  "DELETE",
  "OPTIONS",
];
const defaultAllowedHeaders = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
];

/**
 * Utility: determine whether an incoming origin should be allowed.
 */
function isAllowedOrigin(originHeader?: string): boolean {
  if (!originHeader) return true; // allow tools / non-browser clients
  const normalized = originHeader.replace(/\/+$/, "");
  if (allowedOrigins.includes(normalized)) return true;

  try {
    const parsed = new URL(normalized);
    if (parsed.hostname.endsWith("netlify.app")) return true;
  } catch {
    // ignore parse errors
  }

  return false;
}

/**
 * Preflight (OPTIONS) handler — answer directly with CORS headers.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "OPTIONS") return next();

  const originHeader = (req.headers.origin || "") as string;
  const normalized = originHeader.replace(/\/+$/, "");

  console.log("CORS preflight from origin:", originHeader);

  if (!isAllowedOrigin(originHeader)) {
    console.warn("Blocked CORS preflight origin:", originHeader);
    return res
      .status(403)
      .json({ error: `CORS not allowed for origin ${normalized}` });
  }

  res.setHeader("Access-Control-Allow-Origin", originHeader || "*");
  res.setHeader("Access-Control-Allow-Methods", defaultCorsMethods.join(","));
  res.setHeader(
    "Access-Control-Allow-Headers",
    defaultAllowedHeaders.join(",")
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  return res.sendStatus(204);
});

/**
 * Apply helmet and cors middleware for normal requests (non-OPTIONS).
 */
app.use(helmet());
app.use(
  cors({
    origin: (
      incomingOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!incomingOrigin) return callback(null, true);
      if (isAllowedOrigin(incomingOrigin)) return callback(null, true);
      console.warn("Blocked CORS origin (request):", incomingOrigin);
      return callback(null, false);
    },
    credentials: true,
    methods: defaultCorsMethods,
    allowedHeaders: defaultAllowedHeaders,
    optionsSuccessStatus: 204,
  })
);

// Body parsers and logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/**
 * Public / auth routes
 */
if (authRouter) {
  app.use("/api/auth", authRouter);
} else {
  console.warn("[app] auth router not mounted (auth.routes not available).");
}

/**
 * Parcels router
 */
if (parcelsRouter) {
  app.use("/api/parcels", parcelsRouter);
} else {
  console.warn(
    "[app] parcels router not mounted (parcels.routes not available)."
  );
}

/**
 * Users router — admin only
 */
if (usersRouter) {
  app.use("/api/users", authenticate, allowRoles("admin"), usersRouter);
} else {
  console.warn("[app] users router not mounted (users.routes not available).");
}

/**
 * Dashboard summary: allow admin/sender/receiver
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
 * Root route for Render / browser checks
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "SwiftDrop API is running",
    uptime: process.uptime(),
  });
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
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status?: unknown }).status) || 500
      : 500;
  const message =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: unknown }).message)
      : String(err) || "Internal server error";

  console.error("Server error:", err);
  res.status(status).json({ error: message });
});

app.use("/api/dashboard", dashboardRoutes);

export default app;
