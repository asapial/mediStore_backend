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

// ✅ CORS setup (must be FIRST)
const allowedOrigins = [
  "http://localhost:3000" 
  //  "https://medi-store-frontend-nine.vercel.app"
];

const corsOptions = {
  // origin: allowedOrigins 
  origin:  "http://localhost:3000" ,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

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
