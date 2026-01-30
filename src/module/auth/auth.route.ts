import { Router } from "express";
import { authController } from "./auth.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();


router.post("/register", authController.registerController);
router.post("/login", authController.loginController);
router.get("/me",auth(), authController.meController);



export const  authRouter= router;