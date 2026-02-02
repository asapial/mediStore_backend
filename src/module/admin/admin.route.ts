import { Router } from "express";
import { adminController } from "./admin.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();


router.get("/users",adminController.getAllUsers);
router.get("/users/:id",adminController.getUserDetails);
router.get("/categories",adminController.getAllCategory);
router.put("/categories/:id",adminController.updateCategory);
router.put("/users/:id",adminController.updateUser);
router.get("/stats", auth(), adminController.getAdminStatsController);
router.get("/order",adminController.getAllOrder);
router.patch(
  "/users/:userId/ban",
  auth(),
  adminController.banUserController
);

router.patch("/users/:id", auth(), adminController.adminUpdateUser);

export const adminRouter=router;