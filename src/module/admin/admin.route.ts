import { Router } from "express";
import { adminController } from "./admin.controller";

const router = Router();


router.get("/users",adminController.getAllUsers);
router.get("/users/:id",adminController.getUserDetails);
router.get("/categories",adminController.getAllCategory);
router.put("/users/:id",adminController.updateUser);
router.put("/categories/:id",adminController.updateCategory);



export const adminRouter=router;