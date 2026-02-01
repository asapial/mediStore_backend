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

const getMyMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const userId=req.user.id;
    // Pass query parameters as filters to service
    const medicines = await medicineService.getMyMedicines(userId as string);

    console.log(userId)
    console.log(medicines);

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};


const getMedicineById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const medicine = await medicineService.getMedicineById(id as string);

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

export const medicineController = {

  getAllMedicines,
  getMedicineById,
  getMyMedicines

};