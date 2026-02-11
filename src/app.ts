import express, { Application } from "express";
import cors from "cors";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { sellerRouter } from "./module/seller/seller.route";
import { orderRouter } from "./module/orders/order.route";
import { adminRouter } from "./module/admin/admin.route";
import { authRouter } from "./module/auth/auth.route";
import cookieParser from "cookie-parser";
import { medicineRouter } from "./module/medicine/medicine.router";
import { cartRouter } from "./module/cart/cart.router";

const app: Application = express();
app.use(cookieParser());
app.use(express.json());


// ✅ CORS setup (must be FIRST)
const allowedOrigins = [
  "http://localhost:3000",
   "https://medi-store-frontend-khaki.vercel.app",
   "https://medistorefrontend.vercel.app"
].filter(Boolean);



app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins or matches Vercel preview pattern
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin); // Any Vercel deployment

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);




// Routes
app.use("/api/auth", authRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/medicines", medicineRouter);
app.use("/api/cart", cartRouter);

// Better Auth middleware
app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MediStore API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

export default app;

