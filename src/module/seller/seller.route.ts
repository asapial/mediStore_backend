import { Router } from "express";
import { sellerController } from "./seller.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();



router.post("/medicines",auth(), sellerController.postMedicine);
router.put("/medicines/:id", sellerController.updateMedicine);
router.delete("/medicines/:id", sellerController.deleteMedicine);
router.get("/orders",auth(),sellerController.getSellerOrder)
router.get("/stat", auth(), sellerController.sellerStatController);
router.put("/orders",sellerController.updateOrderItemStatus);



// POST	/api/seller/medicines	Add medicine
// PUT	/api/seller/medicines/:id	Update medicine
// DELETE	/api/seller/medicines/:id	Remove medicine
// GET	/api/seller/orders	Get seller's orders
// PATCH	/api/seller/orders/:id	Update order status


export  const sellerRouter= router;