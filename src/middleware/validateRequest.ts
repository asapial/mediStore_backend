import { NextFunction, Request, Response } from "express";
import { z } from "zod";

type RequestSource = "body" | "query";

export const validateRequest = (schema: z.ZodTypeAny, source: RequestSource = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (source === "body") {
        if (req.body?.data) {
          req.body = JSON.parse(req.body.data);
        }
        const parsedData = schema.parse(req.body ?? {});
        req.body = parsedData;
      } else {
        const raw = { ...req.query } as Record<string, unknown>;
        const parsedData = schema.parse(raw);
        (req as Request & { validatedQuery: unknown }).validatedQuery = parsedData;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};