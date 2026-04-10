import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import auth from "../../middleware/auth.middleware";
import status from "http-status";

const router = Router();

// GET /api/banners?isActive=true
router.get("/", catchAsync(async (req: Request, res: Response) => {
  const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
  const banners = await prisma.banner.findMany({
    where: isActive !== undefined ? { isActive } : {},
    orderBy: { sortOrder: "asc" },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Banners fetched", data: banners });
}));

// POST /api/banners (ADMIN)
router.post("/", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder } = req.body;
  if (!title) throw new AppError(status.BAD_REQUEST, "title is required");
  const banner = await prisma.banner.create({
    data: { title, subtitle, badge, color: color || "#1B3A5C", textColor: textColor || "#FFFFFF", icon, imageUrl, link, isActive: isActive ?? true, sortOrder: Number(sortOrder) || 0 },
  });
  sendResponse(res, { status: status.CREATED, success: true, message: "Banner created", data: banner });
}));

// PUT /api/banners/:id (ADMIN)
router.put("/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  const { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder } = req.body;
  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined },
  });
  sendResponse(res, { status: status.OK, success: true, message: "Banner updated", data: banner });
}));

// DELETE /api/banners/:id (ADMIN)
router.delete("/:id", auth(["ADMIN"]), catchAsync(async (req: Request, res: Response) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  sendResponse(res, { status: status.OK, success: true, message: "Banner deleted", data: null });
}));

export const bannerRouter = router;
