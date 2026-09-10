import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ENTITY_STATUS, ROLES } from "../types/enums";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String },
    role: { type: String, enum: ROLES, required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Institution", default: null, index: true },
    designation: { type: String },
    department: { type: String },
    status: { type: String, enum: ENTITY_STATUS, default: "active", index: true },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model("User", userSchema);
