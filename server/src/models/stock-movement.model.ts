import { Schema, model, type InferSchemaType } from "mongoose";
import { BLOOD_GROUPS, MOVEMENT_TYPES } from "../types/enums";

const stockMovementSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    movementType: { type: String, enum: MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true, min: 1 },
    reference: { type: String },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enquiryId: { type: Schema.Types.ObjectId, ref: "Enquiry", default: null },
  },
  { timestamps: true },
);

stockMovementSchema.index({ tenantId: 1, createdAt: -1 });

export type StockMovement = InferSchemaType<typeof stockMovementSchema>;
export const StockMovementModel = model("StockMovement", stockMovementSchema);
