import { Router } from "express";
import { Types } from "mongoose";
import { AlertThresholdModel, NotificationModel, UserModel } from "../models";
import { auth, requireAuth, requireRole, tenantScope } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateProfileSchema, updateThresholdsSchema } from "../validators/settings.schema";
import { idParams } from "../validators/common.schema";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";
import { paginate, paginationSchema, type Pagination } from "../utils/pagination";
import { BLOOD_GROUPS } from "../types/enums";

/** Notifications, profile and tenant settings. */
export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get(
  "/",
  validate(paginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as Pagination;
    const filter = { userId: auth(req).userId };
    const [data, total, unread] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.per_page).limit(q.per_page).lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ ...filter, readAt: null }),
    ]);
    res.json({ ...paginate(data, total, q), unread });
  }),
);

notificationRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await NotificationModel.updateMany({ userId: auth(req).userId, readAt: null }, { readAt: new Date() });
    res.status(204).end();
  }),
);

notificationRouter.post(
  "/:id/read",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const n = await NotificationModel.findOneAndUpdate({ _id: req.params.id, userId: auth(req).userId }, { readAt: new Date() }, { new: true });
    if (!n) throw ApiError.notFound("Notification not found");
    res.json({ data: n });
  }),
);

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.patch(
  "/profile",
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(auth(req).userId, req.body, { new: true });
    if (!user) throw ApiError.notFound("User not found");
    res.json({ data: user });
  }),
);

settingsRouter.get(
  "/thresholds",
  asyncHandler(async (req, res) => {
    const rows = await AlertThresholdModel.find({ tenantId: tenantScope(req) }).lean();
    const byGroup = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, { low: 20, critical: 10 }]));
    for (const r of rows) byGroup[r.bloodGroup] = { low: r.low, critical: r.critical };
    res.json({ data: byGroup });
  }),
);

settingsRouter.put(
  "/thresholds",
  requireRole("hospital_admin", "super_admin"),
  validate(updateThresholdsSchema),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const body = req.body as Record<string, { low: number; critical: number }>;
    for (const [bloodGroup, t] of Object.entries(body)) {
      if (t.critical > t.low) throw ApiError.badRequest(`${bloodGroup}: critical must be ≤ low`);
      await AlertThresholdModel.findOneAndUpdate({ tenantId, bloodGroup }, t, { upsert: true });
    }
    res.json({ data: body });
  }),
);
