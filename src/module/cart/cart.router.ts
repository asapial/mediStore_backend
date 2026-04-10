import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { cartController } from "./cart.controller";


const router= Router();





router.get("/", auth([ "CUSTOMER"]), cartController.getFromCartController);
router.post("/add", auth(),cartController.addToCartController);
router.get("/status/:medicineId",auth(), cartController.getMedicineCartStatusController);
router.patch("/update", auth([ "CUSTOMER"]), cartController.updateCartItemController);
router.delete("/remove", auth([ "CUSTOMER"]), cartController.removeCartItemController);





export const cartRouter= router;