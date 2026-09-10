import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { BLOOD_GROUPS, COMPONENTS, UNIT_STATUS } from "../types/enums";

const bloodUnitSchema = new Schema(
  {
    unitCode: { type: String, required: true, unique: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
    component: { type: String, enum: COMPONENTS, default: "packed_cells" },
    volumeMl: { type: Number, required: true, min: 1 },
    donorNumber: { type: String },
    storageLocation: { type: String },
    status: { type: String, enum: UNIT_STATUS, default: "available", index: true },
    collectedOn: { type: Date },
    expiresOn: { type: Date, required: true, index: true },
    reservedForEnquiryId: { type: Schema.Types.ObjectId, ref: "Enquiry", default: null },
    discardReason: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bloodUnitSchema.index({ tenantId: 1, bloodGroup: 1, status: 1 });

export type BloodUnit = InferSchemaType<typeof bloodUnitSchema>;
export type BloodUnitDoc = HydratedDocument<BloodUnit>;
export const BloodUnitModel = model("BloodUnit", bloodUnitSchema);
