import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { prescriptionController } from "./prescription.controller";

const router = Router();

// CUSTOMER routes
router.post("/", auth(["CUSTOMER"]), prescriptionController.uploadPrescription);
router.get("/my", auth(["CUSTOMER"]), prescriptionController.getMyPrescriptions);

// ADMIN routes
router.get("/", auth(["ADMIN"]), prescriptionController.getAllPrescriptions);
router.patch("/:id/review", auth(["ADMIN"]), prescriptionController.reviewPrescription);

export const prescriptionRouter = router;
