import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { prisma } from "./prisma";

// const prisma = new PrismaClient();
export const auth = betterAuth({
    trustedOrigins: ["https://medi-store-frontend-nine.vercel.app", "http://localhost:3000"],
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                        type: [  "CUSTOMER" ,"SELLER","ADMIN"],
                        required: false,
                        defaultValue: 'CUSTOMER',
                        input: false,
            }
        }
    },
    advanced:{
        defaultCookieAttributes:{
            sameSite:"none",
            secure:true,
            httpOnly:true
        }
    }
});
