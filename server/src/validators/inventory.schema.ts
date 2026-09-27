import { z } from "zod";
import { BLOOD_GROUPS, COMPONENTS, UNIT_STATUS } from "../types/enums";
import { paginationSchema } from "../utils/pagination";

export const listInventoryQuery = paginationSchema.extend({
  group: z.enum(BLOOD_GROUPS).optional(),
  status: z.enum(UNIT_STATUS).optional(),
  expiring_within_days: z.coerce.number().int().min(0).max(365).optional(),
});

export const createUnitSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  component: z.enum(COMPONENTS).default("packed_cells"),
  volumeMl: z.coerce.number().int().min(50).max(1000).default(450),
  quantity: z.coerce.number().int().min(1).max(200).default(1),
  donorNumber: z.string().optional(),
  storageLocation: z.string().optional(),
  collectedOn: z.coerce.date().optional(),
  expiresOn: z.coerce.date(),
});

export const updateUnitSchema = z.object({
  storageLocation: z.string().optional(),
  status: z.enum(UNIT_STATUS).optional(),
  expiresOn: z.coerce.date().optional(),
});

export const discardSchema = z.object({ reason: z.string().min(3) });

export const issueSchema = z.object({
  issued_to: z.string().min(2),
  note: z.string().optional(),
});

export const reserveSchema = z.object({
  enquiry_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const expiringQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
});
