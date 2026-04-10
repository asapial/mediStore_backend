import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { sellerLicenseController } from "./sellerLicense.controller";

const router = Router();

// SELLER
router.post("/", auth(["SELLER"]), sellerLicenseController.submitLicense);
router.get("/my", auth(["SELLER"]), sellerLicenseController.getMyLicense);

// ADMIN
router.get("/", auth(["ADMIN"]), sellerLicenseController.getAllLicenses);
router.patch("/:sellerId/review", auth(["ADMIN"]), sellerLicenseController.reviewLicense);

export const sellerLicenseRouter = router;
