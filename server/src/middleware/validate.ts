import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { ApiError } from "../utils/errors";

type Source = "body" | "query" | "params";

/** Validates and replaces req[source] with the parsed, typed value. */
export function validate(schema: ZodTypeAny, source: Source = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      Object.defineProperty(req, source, { value: parsed, writable: true, configurable: true });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.unprocessable("Validation failed", error.flatten()));
        return;
      }
      next(error);
    }
  };
}

export type Validated<T extends ZodTypeAny> = z.infer<T>;
