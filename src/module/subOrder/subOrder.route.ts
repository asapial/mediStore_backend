import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { subOrderController } from "./subOrder.controller";

const router = Router();

// SELLER
router.get("/my", auth(["SELLER"]), subOrderController.getSellerSubOrders);
router.patch("/:id/status", auth(["SELLER"]), subOrderController.updateSubOrderStatus);

// CUSTOMER
router.get("/order/:orderId", auth(["CUSTOMER"]), subOrderController.getOrderSubOrders);

export const subOrderRouter = router;
