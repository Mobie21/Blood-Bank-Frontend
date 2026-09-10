import { Schema, model, type InferSchemaType } from "mongoose";
import { NOTIFICATION_TYPES } from "../types/enums";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", default: null },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    link: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, readAt: 1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model("Notification", notificationSchema);
