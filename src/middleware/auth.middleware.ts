import express from "express";
import { auth as betterAuth } from "../lib/auth";

declare global {
    namespace Express {
        interface Request {
            user?: any;
            session?: any;
        }
    }
}

import { IncomingHttpHeaders } from "http";

export const toFetchHeaders = (headers: IncomingHttpHeaders) => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
};

const auth = (allowedRoles?: (  "CUSTOMER" | "SELLER" | "ADMIN" )[]) => {
    return async (
        req: express.Request,res: express.Response,next: express.NextFunction) => {
            console.log("RAW COOKIE HEADER:", req.headers.cookie);
            
            try {
            const session = await betterAuth.api.getSession({
                // headers: req.headers as any,
                headers: toFetchHeaders(req.headers), 
            });

            // ❌ Not logged in
            if (!session || !session.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized. Please log in.",
                });
            }

            // ❌ Role-based restriction (optional)
            if (
                allowedRoles &&
                allowedRoles.length > 0 &&
                !allowedRoles.includes(session.user.role!)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden. Insufficient permissions.",
                });
            }

            // ✅ Attach to request
            req.user = session.user;
            req.session = session.session;

            next();
        } catch (error) {
            console.error("Auth middleware error:", error);

            return res.status(500).json({
                success: false,
                message: "Authentication failed.",
            });
        }
    };
};

export default auth;