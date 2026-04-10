import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { returnController } from "./return.controller";

const router = Router();

// CUSTOMER
router.post("/", auth(["CUSTOMER"]), returnController.submitReturn);
router.get("/my", auth(["CUSTOMER"]), returnController.getMyReturns);

// SELLER + ADMIN — view returns (seller sees all returns for visibility)
router.get("/", auth(["SELLER", "ADMIN"]), returnController.getAllReturns);

// ADMIN only — update status
router.patch("/:id/status", auth(["ADMIN"]), returnController.updateReturnStatus);

export const returnRouter = router;
