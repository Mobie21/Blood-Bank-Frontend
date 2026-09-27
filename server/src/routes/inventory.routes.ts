import { Router } from "express";
import { Types } from "mongoose";
import { BloodUnitModel, StockLevelModel } from "../models";
import { auth, requireAuth, requireRole, tenantScope } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createUnitSchema,
  discardSchema,
  expiringQuery,
  issueSchema,
  listInventoryQuery,
  reserveSchema,
  updateUnitSchema,
} from "../validators/inventory.schema";
import { idParams } from "../validators/common.schema";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";
import { paginate, toSort } from "../utils/pagination";
import { recomputeStockLevel, recordMovement } from "../services/stock.service";
import { writeAudit } from "../services/audit.service";
import { unitCode } from "../utils/reference";
import { BLOOD_GROUPS, type BloodGroup } from "../types/enums";

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

const daysBetween = (date: Date) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 3600 * 1000));

inventoryRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const levels = await StockLevelModel.find({ tenantId }).lean();
    const byGroup = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0])) as Record<string, number>;
    let available = 0;
    let reserved = 0;
    let expiringSoon = 0;
    for (const level of levels) {
      byGroup[level.bloodGroup] = level.available;
      available += level.available;
      reserved += level.reserved;
      expiringSoon += level.expiring30d;
    }
    const criticalGroups = BLOOD_GROUPS.filter((g) => byGroup[g] < 10);
    res.json({
      data: {
        total_units: available + reserved,
        available,
        reserved,
        expiring_soon: expiringSoon,
        critical_groups: criticalGroups,
        by_group: byGroup,
      },
    });
  }),
);

inventoryRouter.get(
  "/expiring",
  validate(expiringQuery, "query"),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const { days } = req.query as unknown as { days: number };
    const units = await BloodUnitModel.find({
      tenantId,
      deletedAt: null,
      status: { $in: ["available", "reserved"] },
      expiresOn: { $lte: new Date(Date.now() + days * 24 * 3600 * 1000) },
    })
      .sort({ expiresOn: 1 })
      .lean();
    res.json({
      data: units.map((u) => ({ ...u, id: String(u._id), days_to_expiry: daysBetween(u.expiresOn) })),
    });
  }),
);

inventoryRouter.get(
  "/",
  validate(listInventoryQuery, "query"),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const query = req.query as unknown as ReturnType<typeof listInventoryQuery.parse>;
    const filter: Record<string, unknown> = { tenantId, deletedAt: null };
    if (query.group) filter.bloodGroup = query.group;
    if (query.status) filter.status = query.status;
    if (query.expiring_within_days !== undefined) {
      filter.expiresOn = {
        $lte: new Date(Date.now() + query.expiring_within_days * 24 * 3600 * 1000),
      };
    }
    if (query.q) filter.unitCode = { $regex: query.q, $options: "i" };

    const [rows, total] = await Promise.all([
      BloodUnitModel.find(filter)
        .sort(toSort(query.sort))
        .skip((query.page - 1) * query.per_page)
        .limit(query.per_page)
        .lean(),
      BloodUnitModel.countDocuments(filter),
    ]);

    res.json(
      paginate(
        rows.map((u) => ({ ...u, id: String(u._id), days_to_expiry: daysBetween(u.expiresOn) })),
        total,
        query,
      ),
    );
  }),
);

inventoryRouter.post(
  "/",
  requireRole("hospital_admin", "super_admin"),
  validate(createUnitSchema),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const body = req.body as ReturnType<typeof createUnitSchema.parse>;

    const docs = Array.from({ length: body.quantity }, () => ({
      unitCode: unitCode(),
      tenantId,
      bloodGroup: body.bloodGroup,
      component: body.component,
      volumeMl: body.volumeMl,
      donorNumber: body.donorNumber,
      storageLocation: body.storageLocation,
      collectedOn: body.collectedOn,
      expiresOn: body.expiresOn,
    }));
    const created = await BloodUnitModel.insertMany(docs);

    await recordMovement({
      tenantId,
      bloodGroup: body.bloodGroup,
      movementType: "add",
      quantity: body.quantity,
      actorId: auth(req).userId,
      reference: body.donorNumber,
    });
    await recomputeStockLevel(tenantId, body.bloodGroup);
    await writeAudit(req, { action: "inventory.create", entity: "blood_units", after: { count: created.length } });

    res.status(201).json({ data: created });
  }),
);

inventoryRouter.get(
  "/:id",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const unit = await BloodUnitModel.findOne({ _id: req.params.id, tenantId, deletedAt: null }).lean();
    if (!unit) throw ApiError.notFound("Unit not found");
    res.json({ data: { ...unit, id: String(unit._id), days_to_expiry: daysBetween(unit.expiresOn) } });
  }),
);

inventoryRouter.patch(
  "/:id",
  requireRole("hospital_admin", "super_admin"),
  validate(idParams, "params"),
  validate(updateUnitSchema),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const unit = await BloodUnitModel.findOneAndUpdate(
      { _id: req.params.id, tenantId, deletedAt: null },
      req.body,
      { new: true },
    );
    if (!unit) throw ApiError.notFound("Unit not found");
    await recomputeStockLevel(tenantId, unit.bloodGroup as BloodGroup);
    res.json({ data: unit });
  }),
);

inventoryRouter.post(
  "/:id/reserve",
  validate(idParams, "params"),
  validate(reserveSchema),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const unit = await BloodUnitModel.findOne({ _id: req.params.id, tenantId, deletedAt: null });
    if (!unit) throw ApiError.notFound("Unit not found");
    if (unit.status !== "available") throw ApiError.conflict("Unit is not available");

    unit.status = "reserved";
    unit.reservedForEnquiryId = (req.body as { enquiry_id?: string }).enquiry_id
      ? new Types.ObjectId((req.body as { enquiry_id: string }).enquiry_id)
      : null;
    await unit.save();

    await recordMovement({
      tenantId,
      bloodGroup: unit.bloodGroup as BloodGroup,
      movementType: "reserve",
      quantity: 1,
      actorId: auth(req).userId,
      enquiryId: unit.reservedForEnquiryId,
    });
    await recomputeStockLevel(tenantId, unit.bloodGroup as BloodGroup);
    res.json({ data: unit });
  }),
);

inventoryRouter.post(
  "/:id/issue",
  requireRole("hospital_admin", "super_admin"),
  validate(idParams, "params"),
  validate(issueSchema),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const unit = await BloodUnitModel.findOne({ _id: req.params.id, tenantId, deletedAt: null });
    if (!unit) throw ApiError.notFound("Unit not found");
    if (!["available", "reserved"].includes(String(unit.status))) {
      throw ApiError.conflict("Unit cannot be issued");
    }
    unit.status = "issued";
    await unit.save();

    await recordMovement({
      tenantId,
      bloodGroup: unit.bloodGroup as BloodGroup,
      movementType: "issue",
      quantity: 1,
      actorId: auth(req).userId,
      reference: (req.body as { issued_to: string }).issued_to,
    });
    await recomputeStockLevel(tenantId, unit.bloodGroup as BloodGroup);
    res.json({ data: unit });
  }),
);

inventoryRouter.delete(
  "/:id",
  requireRole("hospital_admin", "super_admin"),
  validate(idParams, "params"),
  validate(discardSchema),
  asyncHandler(async (req, res) => {
    const tenantId = new Types.ObjectId(tenantScope(req));
    const unit = await BloodUnitModel.findOne({ _id: req.params.id, tenantId, deletedAt: null });
    if (!unit) throw ApiError.notFound("Unit not found");
    unit.deletedAt = new Date();
    unit.discardReason = (req.body as { reason: string }).reason;
    await unit.save();
    await recomputeStockLevel(tenantId, unit.bloodGroup as BloodGroup);
    await writeAudit(req, { action: "inventory.discard", entity: "blood_units", entityId: unit._id });
    res.json({ success: true });
  }),
);
