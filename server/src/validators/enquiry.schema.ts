import { z } from "zod";
import { BLOOD_GROUPS, ENQUIRY_KINDS, ENQUIRY_STATUS, PRIORITIES } from "../types/enums";
import { paginationSchema } from "../utils/pagination";
import { objectId } from "./common.schema";

export const listEnquiriesQuery = paginationSchema.extend({
  direction: z.enum(["received", "sent"]).optional(),
  status: z.enum(ENQUIRY_STATUS).optional(),
  kind: z.enum(ENQUIRY_KINDS).optional(),
});

export const createEnquirySchema = z.object({
  supplier_id: objectId,
  kind: z.enum(ENQUIRY_KINDS),
  group: z.enum(BLOOD_GROUPS),
  quantity: z.coerce.number().int().min(1).max(500).default(1),
  priority: z.enum(PRIORITIES).default("routine"),
  notes: z.string().max(2000).optional(),
});

export const declineSchema = z.object({ reason: z.string().min(3).max(500) });

export const messageSchema = z.object({ body: z.string().min(1).max(2000) });
