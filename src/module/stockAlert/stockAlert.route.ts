import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { stockAlertController } from "./stockAlert.controller";

const router = Router();

// SELLER routes
router.post("/", auth(["SELLER"]), stockAlertController.upsertStockAlert);
router.get("/my", auth(["SELLER"]), stockAlertController.getSellerAlerts);
router.delete("/:medicineId", auth(["SELLER"]), stockAlertController.deleteStockAlert);

// ADMIN routes
router.get("/triggered", auth(["ADMIN"]), stockAlertController.getTriggeredAlerts);

export const stockAlertRouter = router;
