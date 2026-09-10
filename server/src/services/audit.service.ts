import type { Request } from "express";
import { AuditLogModel } from "../models";

export async function writeAudit(
  req: Request,
  params: {
    action: string;
    entity: string;
    entityId?: unknown;
    before?: unknown;
    after?: unknown;
  },
): Promise<void> {
  await AuditLogModel.create({
    actorId: req.auth?.userId ?? null,
    tenantId: req.auth?.tenantId ?? null,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId ?? null,
    before: params.before,
    after: params.after,
    ip: req.ip,
  });
}
