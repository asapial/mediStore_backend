import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import auth from "../../middleware/auth.middleware";
import status from "http-status";

const router = Router();

// GET /api/platform-features?isActive=true
router.get("/", catchAsync(async (req: Request, res: Response) => {
  const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
  const features = await prisma.platformFeature.findMany({
    where: isActive !== undefined ? { isActive } : {},
    orderBy: { sortOrder: "asc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Features fetched", data: features });
}));

// POST (ADMIN)
router.post("/", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { title, description, icon, isActive, sortOrder } = req.body;
  if (!title || !description || !icon) throw new AppError(status.BAD_REQUEST, "title, description, icon required");
  const feat = await prisma.platformFeature.create({
    data: { title, description, icon, isActive: isActive ?? true, sortOrder: Number(sortOrder) || 0 },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Feature created", data: feat });
}));

// PUT /:id (ADMIN)
router.put("/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { title, description, icon, isActive, sortOrder } = req.body;
  const feat = await prisma.platformFeature.update({
    where: { id: req.params.id },
    data: { title, description, icon, isActive, sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Feature updated", data: feat });
}));

// DELETE /:id (ADMIN)
router.delete("/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  await prisma.platformFeature.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Feature deleted", data: null });
}));

export const platformFeatureRouter = router;
