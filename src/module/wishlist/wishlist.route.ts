import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { wishlistController } from "./wishlist.controller";

const router = Router();

router.get("/", auth(["CUSTOMER"]), wishlistController.getWishlist);
router.post("/", auth(["CUSTOMER"]), wishlistController.addItem);
router.delete("/clear", auth(["CUSTOMER"]), wishlistController.clearWishlist);
router.delete("/:medicineId", auth(["CUSTOMER"]), wishlistController.removeItem);

export const wishlistRouter = router;
