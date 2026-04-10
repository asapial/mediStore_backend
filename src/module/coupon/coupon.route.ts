import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { couponController } from "./coupon.controller";

const router = Router();

// CUSTOMER — view available coupons & apply
router.get("/", auth(["CUSTOMER", "SELLER", "ADMIN"]), couponController.getAllCoupons);
router.post("/apply", auth(["CUSTOMER"]), couponController.applyCoupon);

// SELLER / ADMIN — manage coupons
router.post("/", auth(["SELLER", "ADMIN"]), couponController.createCoupon);
router.patch("/:id/toggle", auth(["SELLER", "ADMIN"]), couponController.toggleCoupon);
router.delete("/:id", auth(["SELLER", "ADMIN"]), couponController.deleteCoupon);

export const couponRouter = router;
