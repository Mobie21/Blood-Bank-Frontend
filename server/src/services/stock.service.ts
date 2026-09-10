import { Types } from "mongoose";
import { BloodUnitModel, StockLevelModel, StockMovementModel } from "../models";
import { BLOOD_GROUPS, type BloodGroup, type MovementType } from "../types/enums";

const IN_30_DAYS = () => new Date(Date.now() + 30 * 24 * 3600 * 1000);

/** Recomputes the cached stock_levels row for one (tenant, group) pair. */
export async function recomputeStockLevel(
  tenantId: string | Types.ObjectId,
  bloodGroup: BloodGroup,
): Promise<void> {
  const tenant = new Types.ObjectId(String(tenantId));
  const [available, reserved, expiring30d] = await Promise.all([
    BloodUnitModel.countDocuments({ tenantId: tenant, bloodGroup, status: "available", deletedAt: null }),
    BloodUnitModel.countDocuments({ tenantId: tenant, bloodGroup, status: "reserved", deletedAt: null }),
    BloodUnitModel.countDocuments({
      tenantId: tenant,
      bloodGroup,
      status: "available",
      deletedAt: null,
      expiresOn: { $lte: IN_30_DAYS() },
    }),
  ]);

  await StockLevelModel.findOneAndUpdate(
    { tenantId: tenant, bloodGroup },
    { available, reserved, expiring30d },
    { upsert: true, new: true },
  );
}

export async function recomputeAllStockLevels(tenantId: string | Types.ObjectId): Promise<void> {
  for (const group of BLOOD_GROUPS) {
    await recomputeStockLevel(tenantId, group);
  }
}

export async function recordMovement(params: {
  tenantId: string | Types.ObjectId;
  bloodGroup: BloodGroup;
  movementType: MovementType;
  quantity: number;
  actorId: string | Types.ObjectId;
  reference?: string;
  enquiryId?: string | Types.ObjectId | null;
}): Promise<void> {
  await StockMovementModel.create({
    tenantId: params.tenantId,
    bloodGroup: params.bloodGroup,
    movementType: params.movementType,
    quantity: params.quantity,
    actorId: params.actorId,
    reference: params.reference,
    enquiryId: params.enquiryId ?? null,
  });
}

export async function availableCount(
  tenantId: string | Types.ObjectId,
  bloodGroup: BloodGroup,
): Promise<number> {
  return BloodUnitModel.countDocuments({
    tenantId: new Types.ObjectId(String(tenantId)),
    bloodGroup,
    status: "available",
    deletedAt: null,
  });
}

/** Flips past-expiry units to `expired` and refreshes caches. Run on a schedule. */
export async function expirePastUnits(): Promise<number> {
  const stale = await BloodUnitModel.find({
    status: { $in: ["available", "reserved"] },
    expiresOn: { $lt: new Date() },
    deletedAt: null,
  }).select("_id tenantId bloodGroup");

  if (stale.length === 0) return 0;

  await BloodUnitModel.updateMany(
    { _id: { $in: stale.map((u) => u._id) } },
    { $set: { status: "expired" } },
  );

  const pairs = new Set(stale.map((u) => `${String(u.tenantId)}:${u.bloodGroup}`));
  for (const pair of pairs) {
    const [tenantId, group] = pair.split(":");
    await recomputeStockLevel(tenantId, group as BloodGroup);
  }
  return stale.length;
}
