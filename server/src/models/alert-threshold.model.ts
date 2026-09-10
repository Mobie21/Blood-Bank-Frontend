import { Schema, model, type InferSchemaType } from "mongoose";
import { BLOOD_GROUPS } from "../types/enums";

const alertThresholdSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    low: { type: Number, required: true, min: 0 },
    critical: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

alertThresholdSchema.index({ tenantId: 1, bloodGroup: 1 }, { unique: true });

export type AlertThreshold = InferSchemaType<typeof alertThresholdSchema>;
export const AlertThresholdModel = model("AlertThreshold", alertThresholdSchema);
