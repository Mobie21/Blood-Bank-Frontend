import { Router } from "express";
import { Types } from "mongoose";
import { EnquiryModel, StockLevelModel, StockMovementModel } from "../models";
import { auth, requireAuth, tenantScope } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { trendsQuery } from "../validators/settings.schema";
import { asyncHandler } from "../utils/async-handler";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const METRIC_TYPES: Record<string, string[]> = {
  inflow: ["add", "transfer_in"],
  issued: ["issue", "transfer_out"],
  expired: ["expire"],
};

/** Super admins without a tenant see national figures; everyone else sees their tenant. */
function scopeMatch(req: Parameters<typeof tenantScope>[0]): Record<string, unknown> {
  const ctx = auth(req);
  if (ctx.role === "super_admin" && !ctx.tenantId && !req.query.tenant_id) return {};
  return { tenantId: new Types.ObjectId(tenantScope(req)) };
}

analyticsRouter.get(
  "/trends",
  validate(trendsQuery, "query"),
  asyncHandler(async (req, res) => {
    const { metric, period } = req.query as unknown as { metric: string; period: "7d" | "30d" | "90d" };
    const days = Number(period.replace("d", ""));
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const rows = await StockMovementModel.aggregate<{ _id: string; units: number }>([
      { $match: { ...scopeMatch(req), movementType: { $in: METRIC_TYPES[metric] }, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, units: { $sum: "$quantity" } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ data: rows.map((r) => ({ date: r._id, units: r.units })), meta: { metric, period } });
  }),
);

analyticsRouter.get(
  "/distribution",
  asyncHandler(async (req, res) => {
    const rows = await StockLevelModel.aggregate<{ _id: string; units: number }>([
      { $match: scopeMatch(req) },
      { $group: { _id: "$bloodGroup", units: { $sum: "$available" } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ data: rows.map((r) => ({ group: r._id, units: r.units })) });
  }),
);

analyticsRouter.get(
  "/enquiries",
  asyncHandler(async (req, res) => {
    const match = scopeMatch(req);
    const filter = match.tenantId ? { $or: [{ fromTenantId: match.tenantId }, { toTenantId: match.tenantId }] } : {};
    const rows = await EnquiryModel.aggregate<{ _id: string; count: number }>([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json({ data: Object.fromEntries(rows.map((r) => [r._id, r.count])) });
  }),
);
