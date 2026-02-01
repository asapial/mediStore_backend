import { Request, Response, NextFunction } from "express";
import { medicineService } from "./medicine.service";

const getAllMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Pass query parameters as filters to service
    const medicines = await medicineService.getAllMedicines(req.query);

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

export const medicineController = { getAllMedicines };