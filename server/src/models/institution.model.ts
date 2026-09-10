import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ENTITY_STATUS, INSTITUTION_TYPES } from "../types/enums";

const institutionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: INSTITUTION_TYPES, required: true, index: true },
    province: { type: String, required: true, index: true },
    city: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true, trim: true },
    bloodDeptContact: { type: String },
    departments: { type: [String], default: [] },
    status: { type: String, enum: ENTITY_STATUS, default: "active", index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

institutionSchema.index({ name: "text", city: "text", province: "text" });

export type Institution = InferSchemaType<typeof institutionSchema>;
export type InstitutionDoc = HydratedDocument<Institution>;
export const InstitutionModel = model("Institution", institutionSchema);
