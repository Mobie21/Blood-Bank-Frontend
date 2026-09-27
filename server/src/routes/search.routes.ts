import { Router } from "express";
import { Types } from "mongoose";
import { InstitutionModel, StockLevelModel } from "../models";
import { auth, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { searchBloodQuery } from "../validators/staff.schema";
import { asyncHandler } from "../utils/async-handler";
import { BLOOD_GROUPS, type BloodGroup } from "../types/enums";
import { ApiError } from "../utils/errors";

export const searchRouter = Router();
searchRouter.use(requireAuth);

/** Cross-tenant availability — aggregate counts only, never unit or donor details. */
searchRouter.get(
  "/blood",
  validate(searchBloodQuery, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ReturnType<typeof searchBloodQuery.parse>;
    if (!BLOOD_GROUPS.includes(query.group as BloodGroup)) {
      throw ApiError.badRequest("Unknown blood group");
    }
    const ownTenant = auth(req).tenantId;

    const levels = await StockLevelModel.find({
      bloodGroup: query.group,
      available: { $gte: query.min_quantity },
      ...(ownTenant ? { tenantId: { $ne: new Types.ObjectId(ownTenant) } } : {}),
    }).lean();

    const institutions = await InstitutionModel.find({
      _id: { $in: levels.map((l) => l.tenantId) },
      status: "active",
      deletedAt: null,
      ...(query.province ? { province: query.province } : {}),
      ...(query.type ? { type: query.type } : {}),
    }).lean();

    const byId = new Map(institutions.map((i) => [String(i._id), i]));
    const data = levels
      .filter((l) => byId.has(String(l.tenantId)))
      .map((l) => {
        const institution = byId.get(String(l.tenantId))!;
        return {
          institution: {
            id: String(institution._id),
            name: institution.name,
            type: institution.type,
            city: institution.city,
            province: institution.province,
            phone: institution.phone,
            blood_dept_contact: institution.bloodDeptContact,
            status: institution.status,
          },
          group: l.bloodGroup,
          available: l.available,
          last_updated: l.updatedAt,
        };
      })
      .sort((a, b) => b.available - a.available);

    res.json({ data, meta: { total: data.length } });
  }),
);
