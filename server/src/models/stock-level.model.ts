import { Schema, model, type InferSchemaType } from "mongoose";
import { BLOOD_GROUPS } from "../types/enums";

const stockLevelSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    available: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    expiring30d: { type: Number, default: 0 },
  },
  { timestamps: true },
);

stockLevelSchema.index({ tenantId: 1, bloodGroup: 1 }, { unique: true });

export type StockLevel = InferSchemaType<typeof stockLevelSchema>;
export const StockLevelModel = model("StockLevel", stockLevelSchema);
