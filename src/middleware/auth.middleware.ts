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

const auth = (allowedRoles?: ("user" | "admin")[]) => {
    return async (
        req: express.Request,res: express.Response,next: express.NextFunction) => {
        
            try {
            const session = await betterAuth.api.getSession({
                headers: req.headers as any,
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