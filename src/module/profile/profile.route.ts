import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { getMyProfile, updateMyProfile } from "./profile.service";
import status from "http-status";

const router = Router();

// GET /api/profile/me — enriched role-aware profile with isCompletedProfile
router.get(
  "/me",
  auth(["SELLER", "CUSTOMER", "ADMIN", "WAREHOUSE"]),
  catchAsync(async (req, res) => {
    const data = await getMyProfile(req.user!.id, req.user!.role);
    sendResponse(res, { status: status.OK, success: true, message: "Profile fetched", data });
  })
);

// PATCH /api/profile/me — update name, image, phone, and (for sellers) businessCity
router.patch(
  "/me",
  auth(["SELLER", "CUSTOMER", "ADMIN", "WAREHOUSE"]),
  catchAsync(async (req, res) => {
    const { name, image, businessCity, phone } = req.body as {
      name?: string; image?: string; businessCity?: string; phone?: string;
    };
    const data = await updateMyProfile(req.user!.id, { name, image, businessCity, phone });
    sendResponse(res, { status: status.OK, success: true, message: "Profile updated", data });
  })
);

export const profileRouter = router;
