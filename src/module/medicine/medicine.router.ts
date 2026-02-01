import { Router } from "express";
import { medicineController } from "./medicine.controller";
import auth from "../../middleware/auth.middleware";


const router= Router();



router.get("/",medicineController.getAllMedicines );
router.get("/own",auth(),medicineController.getMyMedicines );
router.get("/:id",medicineController.getMedicineById );

export const medicineRouter=router;