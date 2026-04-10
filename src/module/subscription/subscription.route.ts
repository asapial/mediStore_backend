import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { subscriptionController } from "./subscription.controller";

const router = Router();

// CUSTOMER routes
router.post("/", auth(["CUSTOMER"]), subscriptionController.createSubscription);
router.get("/my", auth(["CUSTOMER"]), subscriptionController.getMySubscriptions);
router.patch("/:id/status", auth(["CUSTOMER"]), subscriptionController.updateSubscriptionStatus);

// SELLER routes
router.get("/seller", auth(["SELLER"]), subscriptionController.getSellerSubscriptions);

export const subscriptionRouter = router;
