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
                type: ["CUSTOMER", "SELLER", "ADMIN", "WAREHOUSE"] as const,
                required: false,
                defaultValue: "CUSTOMER",
                input: true,  // ✅ allow client to pass role during sign-up
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user: any) => {
                    // Block self-registration as ADMIN or WAREHOUSE
                    const role = user.role;
                    if (role === "ADMIN" || role === "WAREHOUSE" || !["CUSTOMER", "SELLER"].includes(role)) {
                        return { data: { ...user, role: "CUSTOMER" } };
                    }
                    return { data: user };
                }
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
        crossSubDomainCookies: {
            enabled: false,
        },
        disableCSRFCheck: true,
        defaultCookieAttributes: {
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            httpOnly: false,
        }
    }


});

