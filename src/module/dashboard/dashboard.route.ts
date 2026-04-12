import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

// GET /api/dashboard
// Returns role-specific stats for ADMIN | SELLER | CUSTOMER
router.get("/", auth(["ADMIN", "SELLER", "CUSTOMER"]), dashboardController.getDashboardStats);

export const dashboardRouter = router;
