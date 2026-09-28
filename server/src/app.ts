import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { globalLimiter } from "./middleware/rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRouter } from "./routes/auth.routes";
import { institutionRouter } from "./routes/institution.routes";
import { inventoryRouter } from "./routes/inventory.routes";
import { searchRouter } from "./routes/search.routes";
import { enquiryRouter } from "./routes/enquiry.routes";
import { staffRouter } from "./routes/staff.routes";
import { adminRouter } from "./routes/admin.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { notificationRouter, settingsRouter } from "./routes/me.routes";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","), credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

  const api = express.Router();
  api.use(globalLimiter);
  api.use("/auth", authRouter);
  api.use("/institutions", institutionRouter);
  api.use("/inventory", inventoryRouter);
  api.use("/search", searchRouter);
  api.use("/enquiries", enquiryRouter);
  api.use("/staff", staffRouter);
  api.use("/admin", adminRouter);
  api.use("/analytics", analyticsRouter);
  api.use("/notifications", notificationRouter);
  api.use("/settings", settingsRouter);
  app.use(env.API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
