import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/errors";
import { env } from "../config/env";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "not_found", message: "Endpoint not found" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: { code: "unprocessable_entity", message: "Validation failed", details: err.flatten() },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: "bad_request", message: `Invalid ${err.path}` } });
    return;
  }

  const duplicate = err as { code?: number; keyValue?: Record<string, unknown> };
  if (duplicate?.code === 11000) {
    res.status(409).json({
      error: {
        code: "conflict",
        message: "A record with these details already exists",
        details: duplicate.keyValue,
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "internal_error",
      message: env.NODE_ENV === "production" ? "Something went wrong" : String(err),
    },
  });
}
