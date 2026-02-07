import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { prisma } from "./prisma";
import { customSession } from "better-auth/plugins";

// const prisma = new PrismaClient();
export const auth = betterAuth({
    trustedOrigins: ["https://medi-store-frontend-khaki.vercel.app", "http://localhost:3000"],
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: ["CUSTOMER", "SELLER", "ADMIN"],
                required: false,
                defaultValue: 'CUSTOMER',
                input: false,
            }
        }
    },
    // advanced:{
    //     defaultCookieAttributes:{
    //         sameSite:"none",
    //         secure:false,
    //         httpOnly:false
    //     }
    // }

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    advanced: {
        cookiePrefix: "better-auth",
        useSecureCookies: process.env.NODE_ENV === "production",
        // useSecureCookies: false,
        crossSubDomainCookies: {
            enabled: false,
        },
        disableCSRFCheck: true, // Allow requests without Origin header (Postman, mobile apps, etc.)
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            httpOnly: false
        }
    }


});

