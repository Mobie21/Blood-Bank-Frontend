import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { BLOOD_GROUPS, ENQUIRY_KINDS, ENQUIRY_STATUS, PRIORITIES } from "../types/enums";

const enquirySchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ENQUIRY_KINDS, required: true },
    fromTenantId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    toTenantId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priority: { type: String, enum: PRIORITIES, default: "routine" },
    message: { type: String },
    status: { type: String, enum: ENQUIRY_STATUS, default: "pending", index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    respondedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    respondedAt: { type: Date, default: null },
    fulfilledAt: { type: Date, default: null },
    declineReason: { type: String },
    idempotencyKey: { type: String, index: true, default: null },
  },
  { timestamps: true },
);

enquirySchema.index({ toTenantId: 1, status: 1 });
enquirySchema.index({ fromTenantId: 1, status: 1 });

export type Enquiry = InferSchemaType<typeof enquirySchema>;
export type EnquiryDoc = HydratedDocument<Enquiry>;
export const EnquiryModel = model("Enquiry", enquirySchema);

const enquiryMessageSchema = new Schema(
  {
    enquiryId: { type: Schema.Types.ObjectId, ref: "Enquiry", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

enquiryMessageSchema.index({ enquiryId: 1, createdAt: 1 });

export type EnquiryMessage = InferSchemaType<typeof enquiryMessageSchema>;
export const EnquiryMessageModel = model("EnquiryMessage", enquiryMessageSchema);
