import { Router } from "express";
import { medicineController } from "./medicine.controller";

const router= Router();



router.get("/",medicineController.getAllMedicines );
router.get("/:id",medicineController.getMedicineById );

export const medicineRouter=router;