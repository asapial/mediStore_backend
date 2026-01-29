import { Router } from "express";
import { orderController } from "./order.controller";
import auth from "../../middleware/auth.middleware";

const router=Router();



router.post("/",auth(),orderController.createOrder);

export const orderRouter=router;