import { Router } from "express";
import { adminController } from "./admin.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();


router.get("/users", auth(["ADMIN"]), adminController.getAllUsers);

// ⚠️ Must be BEFORE /users/:id to avoid route shadowing
router.get("/users/search", auth(["ADMIN"]), adminController.searchUsers);

router.get("/users/:id", adminController.getUserDetails);
router.get("/categories",adminController.getAllCategory);
router.post("/categories",auth([ "ADMIN"]), adminController.createCategory);
router.delete("/categories/:id",auth([ "ADMIN"]), adminController.deleteCategory);
router.put("/categories/:id",auth([ "ADMIN"]), adminController.updateCategory);
router.put("/users/:id",adminController.updateUser);
router.get("/stats", auth([ "ADMIN"]), adminController.getAdminStatsController);
router.get("/order",auth([ "ADMIN"]),adminController.getAllOrder);
router.patch(
  "/users/:userId/ban",
  auth([ "ADMIN"]),
  adminController.banUserController
);

router.patch("/users/:id", auth([ "ADMIN"]), adminController.adminUpdateUser);

// Category featured & metadata
router.patch("/categories/:id/featured", auth(["ADMIN"]), adminController.toggleCategoryFeatured);
router.patch("/categories/:id/meta",    auth(["ADMIN"]), adminController.updateCategoryMeta);

export const adminRouter=router;