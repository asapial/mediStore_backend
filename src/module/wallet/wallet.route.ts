import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { walletController } from "./wallet.controller";

const router = Router();

// CUSTOMER routes
router.get("/my", auth(["CUSTOMER"]), walletController.getMyWallet);
router.post("/topup", auth(["CUSTOMER"]), walletController.topUpWallet);

// ADMIN routes
router.get("/", auth(["ADMIN"]), walletController.getAllWallets);
router.post("/credit", auth(["ADMIN"]), walletController.adminCreditWallet);

export const walletRouter = router;
