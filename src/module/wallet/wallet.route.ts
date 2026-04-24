import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { walletController } from "./wallet.controller";

const router = Router();

// CUSTOMER routes
router.get("/my", auth(["CUSTOMER"]), walletController.getMyWallet);
router.post("/topup", auth(["CUSTOMER"]), walletController.topUpWallet);

// SELLER routes
router.get("/seller/my", auth(["SELLER"]), walletController.getSellerWallet);
router.get("/seller/withdrawals", auth(["SELLER"]), walletController.getWithdrawals);
router.post("/seller/withdraw", auth(["SELLER"]), walletController.requestWithdrawal);

// ADMIN routes
router.get("/", auth(["ADMIN"]), walletController.getAllWallets);
router.post("/credit", auth(["ADMIN"]), walletController.adminCreditWallet);
router.get("/admin/withdrawals", auth(["ADMIN"]), walletController.getAllWithdrawals);
router.patch("/admin/withdrawals/:id", auth(["ADMIN"]), walletController.processWithdrawal);

export const walletRouter = router;
