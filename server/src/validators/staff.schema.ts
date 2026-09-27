import { z } from "zod";
import { ENTITY_STATUS, ROLES } from "../types/enums";
import { paginationSchema } from "../utils/pagination";
import { objectId } from "./common.schema";

export const listStaffQuery = paginationSchema.extend({
  role: z.enum(ROLES).optional(),
  status: z.enum(ENTITY_STATUS).optional(),
  department: z.string().optional(),
});

export const createStaffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(["hospital_admin", "staff"]).default("staff"),
  password: z.string().min(8).optional(),
});

export const updateStaffSchema = createStaffSchema.partial().omit({ password: true });

export const adminCreateUserSchema = createStaffSchema.extend({
  role: z.enum(ROLES),
  tenantId: objectId.nullable().optional(),
});

export const adminUpdateUserSchema = adminCreateUserSchema.partial().omit({ password: true });

export const searchBloodQuery = z.object({
  group: z.string(),
  min_quantity: z.coerce.number().int().min(1).default(1),
  province: z.string().optional(),
  type: z.enum(["hospital", "laboratory"]).optional(),
});
