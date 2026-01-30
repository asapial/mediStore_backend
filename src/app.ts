import express, { Application } from "express"
import cors from "cors";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { sellerRouter } from "./module/seller/seller.route";
import { orderRouter } from "./module/orders/order.route";
import { adminRouter } from "./module/admin/admin.route";
import { authRouter } from "./module/auth/auth.route";

const app: Application = express()
app.use(express.json());

const corsOptions = {
  origin: `${process.env.ORIGIN_URL}`,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(
  cors(corsOptions)
)


app.use("/api/auth", authRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);


app.all("/api/auth/*splat", toNodeHandler(auth));




export default app;