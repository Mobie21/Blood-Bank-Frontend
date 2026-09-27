import { z } from "zod";
import { ENTITY_STATUS, INSTITUTION_TYPES } from "../types/enums";
import { paginationSchema } from "../utils/pagination";

export const listInstitutionsQuery = paginationSchema.extend({
  type: z.enum(INSTITUTION_TYPES).optional(),
  status: z.enum(ENTITY_STATUS).optional(),
  province: z.string().optional(),
});

export const createInstitutionSchema = z.object({
  name: z.string().min(2),
  type: z.enum(INSTITUTION_TYPES),
  province: z.string().min(2),
  city: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  bloodDeptContact: z.string().optional(),
  departments: z.array(z.string()).optional(),
  admin: z
    .object({ name: z.string().min(2), email: z.string().email(), phone: z.string().optional() })
    .optional(),
});

export const updateInstitutionSchema = createInstitutionSchema
  .omit({ admin: true, type: true })
  .partial()
  .extend({ type: z.enum(INSTITUTION_TYPES).optional() });

export const statusSchema = z.object({ status: z.enum(ENTITY_STATUS) });
