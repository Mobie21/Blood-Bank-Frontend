import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";
import { AuditLogModel, EnquiryModel, InstitutionModel, StockLevelModel, UserModel } from "../models";
import { auth, requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { adminCreateUserSchema, adminUpdateUserSchema, listStaffQuery } from "../validators/staff.schema";
import { idParams } from "../validators/common.schema";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";
import { paginate, paginationSchema, toSort, type Pagination } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("super_admin"));

adminRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const [hospitals, laboratories, users, pendingEnquiries, stock] = await Promise.all([
      InstitutionModel.countDocuments({ type: "hospital", deletedAt: null }),
      InstitutionModel.countDocuments({ type: "laboratory", deletedAt: null }),
      UserModel.countDocuments({ deletedAt: null }),
      EnquiryModel.countDocuments({ status: "pending" }),
      StockLevelModel.aggregate<{ _id: string; available: number }>([
        { $group: { _id: "$bloodGroup", available: { $sum: "$available" } } },
      ]),
    ]);
    res.json({
      data: {
        hospitals,
        laboratories,
        users,
        pending_enquiries: pendingEnquiries,
        national_stock: Object.fromEntries(stock.map((s) => [s._id, s.available])),
        total_units: stock.reduce((n, s) => n + s.available, 0),
      },
    });
  }),
);

async function validateTenant(role: string, tenantId?: string | null) {
  if (role === "super_admin") return null;
  if (!tenantId) throw ApiError.badRequest("tenantId is required for institution users");
  const inst = await InstitutionModel.findOne({ _id: tenantId, deletedAt: null });
  if (!inst) throw ApiError.notFound("Institution not found");
  return tenantId;
}

adminRouter.get(
  "/users",
  validate(listStaffQuery.extend({ tenant_id: paginationSchema.shape.q }), "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as Pagination & { role?: string; status?: string; tenant_id?: string };
    const filter: Record<string, unknown> = { deletedAt: null };
    if (q.role) filter.role = q.role;
    if (q.status) filter.status = q.status;
    if (q.tenant_id) filter.tenantId = q.tenant_id;
    if (q.q) filter.$or = [{ fullName: { $regex: q.q, $options: "i" } }, { email: { $regex: q.q, $options: "i" } }];
    const [data, total] = await Promise.all([
      UserModel.find(filter).sort(toSort(q.sort)).skip((q.page - 1) * q.per_page).limit(q.per_page).populate("tenantId", "name code type"),
      UserModel.countDocuments(filter),
    ]);
    res.json(paginate(data, total, q));
  }),
);

adminRouter.post(
  "/users",
  validate(adminCreateUserSchema),
  asyncHandler(async (req, res) => {
    const { password, tenantId, ...body } = req.body as { password?: string; tenantId?: string | null; role: string } & Record<string, unknown>;
    const tenant = await validateTenant(body.role, tenantId);
    const tempPassword = password ?? crypto.randomBytes(6).toString("base64url");
    const user = await UserModel.create({ ...body, tenantId: tenant, passwordHash: await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS) });
    await writeAudit(req, { action: "admin.user.create", entity: "user", entityId: user._id });
    res.status(201).json({ data: user, temporary_password: password ? undefined : tempPassword });
  }),
);

adminRouter.get(
  "/users/:id",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findOne({ _id: req.params.id, deletedAt: null }).populate("tenantId", "name code type");
    if (!user) throw ApiError.notFound("User not found");
    res.json({ data: user });
  }),
);

adminRouter.patch(
  "/users/:id",
  validate(idParams, "params"),
  validate(adminUpdateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findOne({ _id: req.params.id, deletedAt: null });
    if (!user) throw ApiError.notFound("User not found");
    const body = req.body as { role?: string; tenantId?: string | null } & Record<string, unknown>;
    const role = body.role ?? user.role;
    if (body.role || body.tenantId !== undefined) {
      body.tenantId = await validateTenant(role, body.tenantId !== undefined ? body.tenantId : user.tenantId ? String(user.tenantId) : null);
    }
    const before = user.toJSON();
    user.set(body);
    await user.save();
    await writeAudit(req, { action: "admin.user.update", entity: "user", entityId: user._id, before, after: user.toJSON() });
    res.json({ data: user });
  }),
);

for (const [path, status] of [["suspend", "suspended"], ["activate", "active"]] as const) {
  adminRouter.post(
    `/users/:id/${path}`,
    validate(idParams, "params"),
    asyncHandler(async (req, res) => {
      if (req.params.id === auth(req).userId) throw ApiError.badRequest("You cannot change your own status");
      const user = await UserModel.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { status }, { new: true });
      if (!user) throw ApiError.notFound("User not found");
      await writeAudit(req, { action: `admin.user.${path}`, entity: "user", entityId: user._id });
      res.json({ data: user });
    }),
  );
}

adminRouter.delete(
  "/users/:id",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    if (req.params.id === auth(req).userId) throw ApiError.badRequest("You cannot delete yourself");
    const user = await UserModel.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { deletedAt: new Date(), status: "suspended" });
    if (!user) throw ApiError.notFound("User not found");
    await writeAudit(req, { action: "admin.user.delete", entity: "user", entityId: user._id });
    res.status(204).end();
  }),
);

adminRouter.get(
  "/audit-logs",
  validate(paginationSchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as Pagination;
    const filter = q.q ? { action: { $regex: q.q, $options: "i" } } : {};
    const [data, total] = await Promise.all([
      AuditLogModel.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.per_page).limit(q.per_page).populate("actorId", "fullName email").lean(),
      AuditLogModel.countDocuments(filter),
    ]);
    res.json(paginate(data, total, q));
  }),
);
