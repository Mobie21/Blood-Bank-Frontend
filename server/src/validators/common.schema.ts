import { z } from "zod";
import { BLOOD_GROUPS } from "../types/enums";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid id");

export const idParams = z.object({ id: objectId });

export const bloodGroup = z.enum(BLOOD_GROUPS);
