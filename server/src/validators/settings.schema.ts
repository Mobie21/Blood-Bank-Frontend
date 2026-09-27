import { z } from "zod";
import { BLOOD_GROUPS } from "../types/enums";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export const updateThresholdsSchema = z.record(
  z.enum(BLOOD_GROUPS),
  z.object({ low: z.coerce.number().int().min(0), critical: z.coerce.number().int().min(0) }),
);

export const trendsQuery = z.object({
  metric: z.enum(["inflow", "issued", "expired"]).default("inflow"),
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
});
