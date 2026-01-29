import express, { Application } from "express"
import cors from "cors";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { sellerRouter } from "./module/seller/seller.route";

const app: Application = express()
app.use(express.json());

const corsOptions = {
  origin: `${process.env.ORIGIN_URL}`,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(
  cors(corsOptions)
)

// app.all("/api/auth/*", toNodeHandler(auth));
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use("/api/seller", sellerRouter);


// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })


export default app;