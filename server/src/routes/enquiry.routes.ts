import { Router } from "express";
import { Types } from "mongoose";
import { BloodUnitModel, EnquiryMessageModel, EnquiryModel, InstitutionModel } from "../models";
import { auth, requireAuth, tenantScope } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createEnquirySchema,
  declineSchema,
  listEnquiriesQuery,
  messageSchema,
} from "../validators/enquiry.schema";
import { idParams } from "../validators/common.schema";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";
import { paginate, toSort, type Pagination } from "../utils/pagination";
import { enquiryReference } from "../utils/reference";
import { availableCount, recomputeStockLevel, recordMovement } from "../services/stock.service";
import { notifyTenantAdmins } from "../services/notification.service";
import { writeAudit } from "../services/audit.service";
import type { BloodGroup } from "../types/enums";

export const enquiryRouter = Router();
enquiryRouter.use(requireAuth);

async function loadEnquiry(id: string, tenantId: string, side: "supplier" | "any") {
  const enquiry = await EnquiryModel.findById(id);
  if (!enquiry) throw ApiError.notFound("Enquiry not found");
  const isSupplier = String(enquiry.toTenantId) === tenantId;
  const isRequester = String(enquiry.fromTenantId) === tenantId;
  if (side === "supplier" && !isSupplier) throw ApiError.forbidden();
  if (side === "any" && !isSupplier && !isRequester) throw ApiError.notFound("Enquiry not found");
  return enquiry;
}

enquiryRouter.get(
  "/",
  validate(listEnquiriesQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as Pagination & { direction?: string; status?: string; kind?: string };
    const ctx = auth(req);
    const filter: Record<string, unknown> = {};
    const nationalView = ctx.role === "super_admin" && !ctx.tenantId && !req.query.tenant_id;
    if (!nationalView) {
      const tenant = new Types.ObjectId(tenantScope(req));
      if (q.direction === "sent") filter.fromTenantId = tenant;
      else if (q.direction === "received") filter.toTenantId = tenant;
      else filter.$or = [{ fromTenantId: tenant }, { toTenantId: tenant }];
    } else if (q.direction === "sent") {
      // National view: "sent" tab is empty since the national office doesn't send enquiries
      filter._id = null;
    }
    if (q.status) filter.status = q.status;
    if (q.kind) filter.kind = q.kind;
    if (q.q) filter.reference = { $regex: q.q, $options: "i" };
    const [data, total] = await Promise.all([
      EnquiryModel.find(filter)
        .sort(toSort(q.sort))
        .skip((q.page - 1) * q.per_page)
        .limit(q.per_page)
        .populate("fromTenantId toTenantId", "name code province")
        .lean(),
      EnquiryModel.countDocuments(filter),
    ]);
    res.json(paginate(data, total, q));
  }),
);

enquiryRouter.post(
  "/",
  validate(createEnquirySchema),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    const fromTenant = tenantScope(req);
    const body = req.body as { supplier_id: string; kind: "enquiry" | "order"; group: BloodGroup; quantity: number; priority: string; notes?: string };
    if (body.supplier_id === fromTenant) throw ApiError.badRequest("Cannot enquire to your own institution");

    const idem = req.header("Idempotency-Key") ?? null;
    if (idem) {
      const existing = await EnquiryModel.findOne({ idempotencyKey: idem, fromTenantId: fromTenant });
      if (existing) return res.status(200).json({ data: existing });
    }

    const supplier = await InstitutionModel.findOne({ _id: body.supplier_id, status: "active", deletedAt: null });
    if (!supplier) throw ApiError.notFound("Supplier not found");

    if (body.kind === "order") {
      const available = await availableCount(supplier._id, body.group);
      if (available < body.quantity) throw ApiError.conflict("Insufficient stock", { available });
    }

    const enquiry = await EnquiryModel.create({
      reference: enquiryReference(),
      kind: body.kind,
      fromTenantId: fromTenant,
      toTenantId: supplier._id,
      bloodGroup: body.group,
      quantity: body.quantity,
      priority: body.priority,
      message: body.notes,
      requestedBy: ctx.userId,
      idempotencyKey: idem,
    });

    await notifyTenantAdmins({
      tenantId: String(supplier._id),
      type: "enquiry_new",
      title: `New ${body.kind} ${enquiry.reference}`,
      body: `${body.quantity} × ${body.group} (${body.priority})`,
      severity: body.priority === "emergency" ? "critical" : "info",
      link: `/enquiries/${String(enquiry._id)}`,
    });
    await writeAudit(req, { action: "enquiry.create", entity: "enquiry", entityId: enquiry._id, after: enquiry.toObject() });
    res.status(201).json({ data: enquiry });
  }),
);

enquiryRouter.get(
  "/:id",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const enquiry = await loadEnquiry(req.params.id, tenantScope(req), "any");
    const messages = await EnquiryMessageModel.find({ enquiryId: enquiry._id }).sort({ createdAt: 1 }).lean();
    await enquiry.populate("fromTenantId toTenantId", "name code province phone");
    res.json({ data: { ...enquiry.toObject(), messages } });
  }),
);

enquiryRouter.post(
  "/:id/approve",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    const tenant = tenantScope(req);
    const enquiry = await loadEnquiry(req.params.id, tenant, "supplier");
    if (enquiry.status !== "pending") throw ApiError.conflict(`Enquiry is ${enquiry.status}`);

    if (enquiry.kind === "order") {
      const units = await BloodUnitModel.find({ tenantId: tenant, bloodGroup: enquiry.bloodGroup, status: "available", deletedAt: null })
        .sort({ expiresOn: 1 })
        .limit(enquiry.quantity);
      if (units.length < enquiry.quantity) throw ApiError.conflict("Insufficient stock", { available: units.length });
      await BloodUnitModel.updateMany(
        { _id: { $in: units.map((u) => u._id) } },
        { $set: { status: "reserved", reservedForEnquiryId: enquiry._id } },
      );
      await recordMovement({ tenantId: tenant, bloodGroup: enquiry.bloodGroup, movementType: "reserve", quantity: enquiry.quantity, actorId: ctx.userId, reference: enquiry.reference, enquiryId: enquiry._id });
      await recomputeStockLevel(tenant, enquiry.bloodGroup);
    }

    enquiry.status = "approved";
    enquiry.respondedBy = new Types.ObjectId(ctx.userId);
    enquiry.respondedAt = new Date();
    await enquiry.save();
    await notifyTenantAdmins({ tenantId: String(enquiry.fromTenantId), type: "enquiry_response", title: `${enquiry.reference} approved` });
    await writeAudit(req, { action: "enquiry.approve", entity: "enquiry", entityId: enquiry._id });
    res.json({ data: enquiry });
  }),
);

enquiryRouter.post(
  "/:id/decline",
  validate(idParams, "params"),
  validate(declineSchema),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    const enquiry = await loadEnquiry(req.params.id, tenantScope(req), "supplier");
    if (enquiry.status !== "pending") throw ApiError.conflict(`Enquiry is ${enquiry.status}`);
    enquiry.status = "declined";
    enquiry.declineReason = (req.body as { reason: string }).reason;
    enquiry.respondedBy = new Types.ObjectId(ctx.userId);
    enquiry.respondedAt = new Date();
    await enquiry.save();
    await notifyTenantAdmins({ tenantId: String(enquiry.fromTenantId), type: "enquiry_response", title: `${enquiry.reference} declined`, body: enquiry.declineReason, severity: "warning" });
    await writeAudit(req, { action: "enquiry.decline", entity: "enquiry", entityId: enquiry._id });
    res.json({ data: enquiry });
  }),
);

enquiryRouter.post(
  "/:id/fulfil",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    const tenant = tenantScope(req);
    const enquiry = await loadEnquiry(req.params.id, tenant, "supplier");
    if (enquiry.status !== "approved") throw ApiError.conflict("Only approved enquiries can be fulfilled");

    if (enquiry.kind === "order") {
      const units = await BloodUnitModel.find({ reservedForEnquiryId: enquiry._id, status: "reserved" });
      // Transfer: units move to the requesting tenant as available stock.
      await BloodUnitModel.updateMany(
        { _id: { $in: units.map((u) => u._id) } },
        { $set: { tenantId: enquiry.fromTenantId, status: "available", reservedForEnquiryId: null } },
      );
      await recordMovement({ tenantId: tenant, bloodGroup: enquiry.bloodGroup, movementType: "transfer_out", quantity: units.length, actorId: ctx.userId, reference: enquiry.reference, enquiryId: enquiry._id });
      await recordMovement({ tenantId: enquiry.fromTenantId, bloodGroup: enquiry.bloodGroup, movementType: "transfer_in", quantity: units.length, actorId: ctx.userId, reference: enquiry.reference, enquiryId: enquiry._id });
      await recomputeStockLevel(tenant, enquiry.bloodGroup);
      await recomputeStockLevel(enquiry.fromTenantId, enquiry.bloodGroup);
    }

    enquiry.status = "fulfilled";
    enquiry.fulfilledAt = new Date();
    await enquiry.save();
    await notifyTenantAdmins({ tenantId: String(enquiry.fromTenantId), type: "order_fulfilled", title: `${enquiry.reference} fulfilled` });
    await writeAudit(req, { action: "enquiry.fulfil", entity: "enquiry", entityId: enquiry._id });
    res.json({ data: enquiry });
  }),
);

enquiryRouter.post(
  "/:id/cancel",
  validate(idParams, "params"),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    const tenant = tenantScope(req);
    const enquiry = await EnquiryModel.findById(req.params.id);
    if (!enquiry || String(enquiry.fromTenantId) !== tenant) throw ApiError.notFound("Enquiry not found");
    if (!["pending", "approved"].includes(enquiry.status)) throw ApiError.conflict(`Enquiry is ${enquiry.status}`);
    if (enquiry.status === "approved" && enquiry.kind === "order") {
      const released = await BloodUnitModel.updateMany(
        { reservedForEnquiryId: enquiry._id, status: "reserved" },
        { $set: { status: "available", reservedForEnquiryId: null } },
      );
      await recordMovement({ tenantId: enquiry.toTenantId, bloodGroup: enquiry.bloodGroup, movementType: "release", quantity: released.modifiedCount, actorId: ctx.userId, reference: enquiry.reference, enquiryId: enquiry._id });
      await recomputeStockLevel(enquiry.toTenantId, enquiry.bloodGroup);
    }
    enquiry.status = "cancelled";
    await enquiry.save();
    await writeAudit(req, { action: "enquiry.cancel", entity: "enquiry", entityId: enquiry._id });
    res.json({ data: enquiry });
  }),
);

enquiryRouter.post(
  "/:id/messages",
  validate(idParams, "params"),
  validate(messageSchema),
  asyncHandler(async (req, res) => {
    const ctx = auth(req);
    const enquiry = await loadEnquiry(req.params.id, tenantScope(req), "any");
    const message = await EnquiryMessageModel.create({ enquiryId: enquiry._id, senderId: ctx.userId, body: (req.body as { body: string }).body });
    res.status(201).json({ data: message });
  }),
);
