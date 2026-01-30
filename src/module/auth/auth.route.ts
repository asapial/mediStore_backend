import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();


router.post("/register", authController.registerController);
router.post("/login", authController.loginController);



export const  authRouter= router;