import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { medicineBatchController } from "./medicineBatch.controller";

const router = Router();

// SELLER routes
router.post("/", auth(["SELLER"]), medicineBatchController.createBatch);
router.get("/my", auth(["SELLER"]), medicineBatchController.getSellerBatches);
router.get("/expiring", auth(["SELLER"]), medicineBatchController.getExpiringBatches);
router.delete("/:id", auth(["SELLER"]), medicineBatchController.deleteBatch);

export const medicineBatchRouter = router;
