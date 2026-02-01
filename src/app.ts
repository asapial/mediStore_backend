import express, { Application } from "express"

import cors from "cors";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { sellerRouter } from "./module/seller/seller.route";
import { orderRouter } from "./module/orders/order.route";
import { adminRouter } from "./module/admin/admin.route";
import { authRouter } from "./module/auth/auth.route";
import cookieParser from "cookie-parser";
import { medicineRouter } from "./module/medicine/medicine.router";

const app: Application = express()
app.use(cookieParser());
app.use(express.json());

const corsOptions = {
  origin: `${process.env.ORIGIN_URL}`,
  optionsSuccessStatus: 200 ,// some legacy browsers (IE11, various SmartTVs) choke on 204
   credentials:true
}

app.use(
  cors(corsOptions)
)


app.use("/api/auth", authRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/medicines", medicineRouter);


app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MediStore API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});


export default app;