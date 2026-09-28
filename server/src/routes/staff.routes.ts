import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";
import { UserModel } from "../models";
import { auth, requireAuth, requireRole, tenantScope } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createStaffSchema, listStaffQuery, updateStaffSchema } from "../validators/staff.schema";
import { idParams } from "../validators/common.schema";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";
import { paginate, toSort, type Pagination } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";
import { notifyUser } from "../services/notification.service";

export const staffRouter = Router();
staffRouter.use(requireAuth);

async function findStaff(id: string, tenantId: string) {
  const user = await UserModel.findOne({ _id: id, tenantId, deletedAt: null });
  if (!user) throw ApiError.notFound("Staff member not found");
  return user;
}

staffRouter.get(
  "/",
  validate(listStaffQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as Pagination & { role?: string; status?: string; department?: string };
    const filter: Record<string, unknown> = { tenantId: tenantScope(req), deletedAt: null };
    if (q.role) filter.role = q.role;
    if (q.status) filter.status = q.status;
    if (q.department) filter.department = q.department;
    if (q.q) filter.$or = [{ fullName: { $regex: q.q, $options: "i" } }, { email: { $regex: q.q, $options: "i" } }];
    const [data, total] = await Promise.all([
      UserModel.find(filter).sort(toSort(q.sort)).skip((q.page - 1) * q.per_page).limit(q.per_page),
      UserModel.countDocuments(filter),
    ]);
    res.json(paginate(data, total, q));
  }),
);

staffRouter.post(
  "/",
  requireRole("hospital_admin", "super_admin"),
  validate(createStaffSchema),
  asyncHandler(async (req, res) => {
    const tenantId = tenantScope(req);
    const { password, ...body } = req.body as { password?: string; email: string } & Record<string, unknown>;
    const tempPassword = password ?? crypto.randomBytes(6).toString("base64url");
    const user = await UserModel.create({
      ...body,
      tenantId,
      passwordHash: await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS),
    });
    await notifyUser(String(user._id), tenantId, { type: "user_added", title: "Welcome to HaemoCentral" });
    await writeAudit(req, { action: "staff.create", entity: "user", entityId: user._id });
    res.status(201).json({ data: user, temporary_password: password ? undefined : tempPassword });
  }),
);

staffRouter.get(
  "/:id",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    res.json({ data: await findStaff(req.params.id, tenantScope(req)) });
  }),
);

staffRouter.patch(
  "/:id",
  requireRole("hospital_admin", "super_admin"),
  validate(idParams, "params"),
  validate(updateStaffSchema),
  asyncHandler(async (req, res) => {
    const user = await findStaff(req.params.id, tenantScope(req));
    const before = user.toJSON();
    user.set(req.body);
    await user.save();
    await writeAudit(req, { action: "staff.update", entity: "user", entityId: user._id, before, after: user.toJSON() });
    res.json({ data: user });
  }),
);

for (const [path, status] of [["suspend", "suspended"], ["activate", "active"]] as const) {
  staffRouter.post(
    `/:id/${path}`,
    requireRole("hospital_admin", "super_admin"),
    validate(idParams, "params"),
    asyncHandler(async (req, res) => {
      if (req.params.id === auth(req).userId) throw ApiError.badRequest("You cannot change your own status");
      const user = await findStaff(req.params.id, tenantScope(req));
      user.status = status;
      await user.save();
      await writeAudit(req, { action: `staff.${path}`, entity: "user", entityId: user._id });
      res.json({ data: user });
    }),
  );
}

staffRouter.delete(
  "/:id",
  requireRole("hospital_admin", "super_admin"),
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    if (req.params.id === auth(req).userId) throw ApiError.badRequest("You cannot delete yourself");
    const user = await findStaff(req.params.id, tenantScope(req));
    user.deletedAt = new Date();
    user.status = "suspended";
    await user.save();
    await writeAudit(req, { action: "staff.delete", entity: "user", entityId: user._id });
    res.status(204).end();
  }),
);
