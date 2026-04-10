import { Router } from "express";
import { medicineController } from "./medicine.controller";
import auth from "../../middleware/auth.middleware";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import status from "http-status";

const router = Router();

router.get("/", medicineController.getAllMedicines);
router.get("/own", auth(["SELLER"]), medicineController.getMyMedicines);

// Featured medicines (public)
router.get("/featured", catchAsync(async (req, res) => {
  const medicines = await prisma.medicine.findMany({
    where: { isFeatured: true, stock: { gt: 0 } },
    include: {
      category: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  sendResponse(res, { status: status.OK, success: true, message: "Featured medicines", data: medicines });
}));

// Toggle featured (ADMIN)
router.patch("/:id/feature", auth(["ADMIN"]), catchAsync(async (req, res) => {
  const { isFeatured } = req.body;
  const med = await prisma.medicine.update({
    where: { id: req.params.id },
    data: { isFeatured: Boolean(isFeatured) },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
    },
  });
  sendResponse(res, { status: status.OK, success: true, message: `Medicine ${isFeatured ? "featured" : "unfeatured"}`, data: med });
}));

// Toggle category featured (ADMIN)
router.patch("/categories/:id/featured", auth(["ADMIN"]), catchAsync(async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!cat) return sendResponse(res, { status: status.NOT_FOUND, success: false, message: "Category not found", data: null });
  const updated = await prisma.category.update({
    where: { id: req.params.id },
    data: { isFeatured: !cat.isFeatured },
  });
  sendResponse(res, { status: status.OK, success: true, message: `Category ${updated.isFeatured ? "featured" : "unfeatured"}`, data: updated });
}));

router.get("/:id", medicineController.getMedicineById);

export const medicineRouter = router;