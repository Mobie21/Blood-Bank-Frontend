import { Router } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { env } from "../config/env";
import { AlertThresholdModel, InstitutionModel, StockLevelModel, UserModel } from "../models";
import { auth, requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createInstitutionSchema,
  listInstitutionsQuery,
  statusSchema,
  updateInstitutionSchema,
} from "../validators/institution.schema";
import { idParams } from "../validators/common.schema";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";
import { paginate, toSort } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";
import { BLOOD_GROUPS } from "../types/enums";

export const institutionRouter = Router();
institutionRouter.use(requireAuth);

function codeFrom(name: string): string {
  const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "INST";
  return `${base}-${Math.floor(Math.random() * 90 + 10)}`;
}

async function stockMap(tenantId: Types.ObjectId) {
  const levels = await StockLevelModel.find({ tenantId }).lean();
  const stock = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0])) as Record<string, number>;
  for (const level of levels) stock[level.bloodGroup] = level.available;
  const total = Object.values(stock).reduce((a, b) => a + b, 0);
  return { stock, total };
}

institutionRouter.get(
  "/",
  validate(listInstitutionsQuery, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ReturnType<typeof listInstitutionsQuery.parse>;
    const filter: Record<string, unknown> = { deletedAt: null };
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.province) filter.province = query.province;
    if (query.q) filter.name = { $regex: query.q, $options: "i" };

    const [rows, total] = await Promise.all([
      InstitutionModel.find(filter)
        .sort(toSort(query.sort))
        .skip((query.page - 1) * query.per_page)
        .limit(query.per_page)
        .lean(),
      InstitutionModel.countDocuments(filter),
    ]);

    const data = await Promise.all(
      rows.map(async (row) => {
        const { stock, total: totalUnits } = await stockMap(row._id);
        const staffCount = await UserModel.countDocuments({ tenantId: row._id, deletedAt: null });
        return { ...row, id: String(row._id), stock, total_units: totalUnits, staff_count: staffCount };
      }),
    );

    res.json(paginate(data, total, query));
  }),
);

institutionRouter.post(
  "/",
  requireRole("super_admin"),
  validate(createInstitutionSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof createInstitutionSchema.parse>;
    const institution = await InstitutionModel.create({ ...body, code: codeFrom(body.name) });

    await StockLevelModel.insertMany(
      BLOOD_GROUPS.map((bloodGroup) => ({ tenantId: institution._id, bloodGroup })),
    );
    await AlertThresholdModel.insertMany(
      BLOOD_GROUPS.map((bloodGroup) => ({
        tenantId: institution._id,
        bloodGroup,
        low: 20,
        critical: 8,
      })),
    );

    let admin = null;
    if (body.admin) {
      const exists = await UserModel.findOne({ email: body.admin.email.toLowerCase() });
      if (exists) throw ApiError.conflict("A user with that email already exists");
      admin = await UserModel.create({
        email: body.admin.email.toLowerCase(),
        fullName: body.admin.name,
        phone: body.admin.phone,
        role: "hospital_admin",
        tenantId: institution._id,
        passwordHash: await bcrypt.hash(env.SEED_DEFAULT_PASSWORD, env.BCRYPT_ROUNDS),
      });
    }

    await writeAudit(req, {
      action: "institution.create",
      entity: "institutions",
      entityId: institution._id,
      after: institution.toObject(),
    });

    res.status(201).json({ data: institution, admin });
  }),
);

institutionRouter.get(
  "/:id",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const institution = await InstitutionModel.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).lean();
    if (!institution) throw ApiError.notFound("Institution not found");
    const { stock, total } = await stockMap(institution._id);
    res.json({ data: { ...institution, id: String(institution._id), stock, total_units: total } });
  }),
);

institutionRouter.patch(
  "/:id",
  validate(idParams, "params"),
  validate(updateInstitutionSchema),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    if (ctx.role !== "super_admin" && ctx.tenantId !== req.params.id) throw ApiError.forbidden();

    const before = await InstitutionModel.findById(req.params.id).lean();
    if (!before) throw ApiError.notFound("Institution not found");

    const updated = await InstitutionModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await writeAudit(req, {
      action: "institution.update",
      entity: "institutions",
      entityId: before._id,
      before,
      after: updated?.toObject(),
    });
    res.json({ data: updated });
  }),
);

institutionRouter.patch(
  "/:id/status",
  requireRole("super_admin"),
  validate(idParams, "params"),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const updated = await InstitutionModel.findByIdAndUpdate(
      req.params.id,
      { status: (req.body as { status: string }).status },
      { new: true },
    );
    if (!updated) throw ApiError.notFound("Institution not found");
    await writeAudit(req, {
      action: "institution.status",
      entity: "institutions",
      entityId: updated._id,
      after: { status: updated.status },
    });
    res.json({ data: updated });
  }),
);

institutionRouter.delete(
  "/:id",
  requireRole("super_admin"),
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const institution = await InstitutionModel.findById(req.params.id);
    if (!institution || institution.deletedAt) throw ApiError.notFound("Institution not found");
    institution.deletedAt = new Date();
    institution.status = "suspended";
    await institution.save();
    await writeAudit(req, {
      action: "institution.delete",
      entity: "institutions",
      entityId: institution._id,
    });
    res.json({ success: true });
  }),
);

institutionRouter.get(
  "/:id/stock",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const levels = await StockLevelModel.find({ tenantId: req.params.id }).lean();
    res.json({ data: levels });
  }),
);
