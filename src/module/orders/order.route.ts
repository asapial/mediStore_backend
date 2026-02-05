import { Router } from "express";
import { orderController } from "./order.controller";
import auth from "../../middleware/auth.middleware";

const router=Router();



router.post("/",auth(),orderController.createOrder);
router.get("/",auth(),orderController.getUsersOrder);
router.get("/:id",auth(),orderController.getOrderDetails);
router.delete("/:id",auth(),orderController.orderDeleteByCustomer);

export const orderRouter=router;


// POST	/api/orders	Create new order
// GET	/api/orders	Get user's orders
// GET	/api/orders/:id	Get order details