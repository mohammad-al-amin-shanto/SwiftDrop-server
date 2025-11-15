import parcelsRouter from "./routes/parcels.routes";
import usersRouter from "./routes/users.routes"; // create a small router that wires admin endpoints
import { getDashboardSummary } from "./controllers/dashboard.controller";

app.use("/api/parcels", parcelsRouter);
app.use("/api/users", usersRouter); // protected by authenticate + allowRoles('admin')
app.get(
  "/api/dashboard/summary",
  authenticate,
  allowRoles("admin", "sender", "receiver"),
  getDashboardSummary
);
