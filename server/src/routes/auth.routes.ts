import { Router } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { env } from "../config/env";
import { InstitutionModel, SessionModel, UserModel } from "../models";
import { requireAuth, auth } from "../middleware/auth";
import { loginLimiter } from "../middleware/rate-limit";
import { validate } from "../middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from "../validators/auth.schema";
import {
  accessTokenSeconds,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/token.service";
import { writeAudit } from "../services/audit.service";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/errors";

export const authRouter = Router();

async function presentUser(userId: Types.ObjectId | string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw ApiError.notFound("User not found");
  const tenant = user.tenantId ? await InstitutionModel.findById(user.tenantId).lean() : null;
  return {
    id: String(user._id),
    name: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department ?? null,
    designation: user.designation ?? null,
    phone: user.phone ?? null,
    tenant: tenant
      ? {
          id: String(tenant._id),
          name: tenant.name,
          type: tenant.type,
          city: tenant.city,
          province: tenant.province,
        }
      : null,
  };
}

authRouter.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await UserModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    if (user.status !== "active") throw ApiError.forbidden("This account is suspended");

    if (user.tenantId) {
      const tenant = await InstitutionModel.findById(user.tenantId).lean();
      if (!tenant || tenant.status !== "active" || tenant.deletedAt) {
        throw ApiError.forbidden("Your institution is inactive");
      }
    }

    const accessToken = signAccessToken({
      sub: String(user._id),
      role: user.role,
      tenant_id: user.tenantId ? String(user.tenantId) : null,
    });
    const refreshToken = signRefreshToken(String(user._id));

    await SessionModel.create({
      userId: user._id,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(verifyRefreshToken(refreshToken).exp * 1000),
    });

    user.lastLoginAt = new Date();
    await user.save();

    await writeAudit(req, { action: "auth.login", entity: "users", entityId: user._id });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: accessTokenSeconds(),
      user: await presentUser(user._id),
    });
  }),
);

authRouter.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refresh_token: token } = req.body as { refresh_token: string };
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const session = await SessionModel.findOne({
      refreshTokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session) throw ApiError.unauthorized("Session expired, please sign in again");

    const user = await UserModel.findById(payload.sub);
    if (!user || user.status !== "active" || user.deletedAt) {
      throw ApiError.unauthorized("Account unavailable");
    }

    res.json({
      access_token: signAccessToken({
        sub: String(user._id),
        role: user.role,
        tenant_id: user.tenantId ? String(user.tenantId) : null,
      }),
      expires_in: accessTokenSeconds(),
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = (req.body as { refresh_token?: string })?.refresh_token;
    if (token) {
      await SessionModel.updateOne(
        { refreshTokenHash: hashToken(token) },
        { $set: { revokedAt: new Date() } },
      );
    } else {
      await SessionModel.updateMany(
        { userId: auth(req).userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }
    res.json({ success: true });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await presentUser(auth(req).userId) });
  }),
);

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(async (_req, res) => {
    // Always 200 so the endpoint cannot be used to enumerate accounts.
    res.json({ success: true, message: "If the account exists, a reset link has been sent" });
  }),
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };
    let userId: string;
    try {
      userId = verifyRefreshToken(token).sub;
    } catch {
      throw ApiError.badRequest("Reset link is invalid or has expired");
    }
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    user.passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    await user.save();
    await SessionModel.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });
    res.json({ success: true });
  }),
);

authRouter.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body as {
      current_password: string;
      new_password: string;
    };
    const user = await UserModel.findById(auth(req).userId);
    if (!user) throw ApiError.notFound("User not found");
    if (!(await bcrypt.compare(current_password, user.passwordHash))) {
      throw ApiError.badRequest("Current password is incorrect");
    }
    user.passwordHash = await bcrypt.hash(new_password, env.BCRYPT_ROUNDS);
    await user.save();
    await writeAudit(req, { action: "auth.change_password", entity: "users", entityId: user._id });
    res.json({ success: true });
  }),
);

export { presentUser };
