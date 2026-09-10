import type { NextFunction, Request, RequestHandler, Response } from "express";
import { verifyAccessToken } from "../services/token.service";
import { ApiError } from "../utils/errors";
import type { Role } from "../types/enums";

export interface AuthContext {
  userId: string;
  role: Role;
  tenantId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized());
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.auth = { userId: payload.sub, role: payload.role, tenantId: payload.tenant_id ?? null };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(ApiError.forbidden());
    next();
  };
}

/** Returns the caller's auth context or throws 401. */
export function auth(req: Request): AuthContext {
  if (!req.auth) throw ApiError.unauthorized();
  return req.auth;
}

/** Tenant id from the token; super admins may pass ?tenant_id= explicitly. */
export function tenantScope(req: Request): string {
  const ctx = auth(req);
  if (ctx.tenantId) return ctx.tenantId;
  const override = (req.query.tenant_id as string | undefined) ?? undefined;
  if (ctx.role === "super_admin" && override) return override;
  throw ApiError.badRequest("tenant_id is required for cross-tenant access");
}
