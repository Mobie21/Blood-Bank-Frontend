import { NotificationModel, UserModel } from "../models";
import type { NotificationType } from "../types/enums";

interface NotifyParams {
  tenantId: string;
  type: NotificationType;
  title: string;
  body?: string;
  severity?: "info" | "warning" | "critical";
  link?: string;
}

/** Notifies every active admin of a tenant. */
export async function notifyTenantAdmins(params: NotifyParams): Promise<void> {
  const admins = await UserModel.find({
    tenantId: params.tenantId,
    role: "hospital_admin",
    status: "active",
    deletedAt: null,
  }).select("_id");

  if (admins.length === 0) return;

  await NotificationModel.insertMany(
    admins.map((admin) => ({
      userId: admin._id,
      tenantId: params.tenantId,
      type: params.type,
      title: params.title,
      body: params.body,
      severity: params.severity ?? "info",
      link: params.link,
    })),
  );
}

export async function notifyUser(
  userId: string,
  tenantId: string | null,
  params: Omit<NotifyParams, "tenantId">,
): Promise<void> {
  await NotificationModel.create({
    userId,
    tenantId,
    type: params.type,
    title: params.title,
    body: params.body,
    severity: params.severity ?? "info",
    link: params.link,
  });
}
