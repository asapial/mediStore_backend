import { Router } from "express";
import { sellerController } from "./seller.controller";

const router = Router();



router.post("/medicines", sellerController.postMedicine);
router.put("/medicines/:id", sellerController.updateMedicine);
router.delete("/medicines/:id", sellerController.deleteMedicine);


// POST	/api/seller/medicines	Add medicine
// PUT	/api/seller/medicines/:id	Update medicine
// DELETE	/api/seller/medicines/:id	Remove medicine
// GET	/api/seller/orders	Get seller's orders
// PATCH	/api/seller/orders/:id	Update order status


export  const sellerRouter= router;