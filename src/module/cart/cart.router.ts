import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { cartController } from "./cart.controller";


const router= Router();





router.get("/", auth(), cartController.getFromCartController);
router.post("/add", auth(),cartController.addToCartController);
router.get("/status/:medicineId",auth(), cartController.getMedicineCartStatusController);
router.patch("/update", auth(), cartController.updateCartItemController);
router.delete("/remove", auth(), cartController.removeCartItemController);





export const cartRouter= router;