import { Schema, model, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", default: null, index: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AuditLog = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel = model("AuditLog", auditLogSchema);
