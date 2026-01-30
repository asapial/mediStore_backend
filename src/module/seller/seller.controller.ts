import { Request, Response, NextFunction } from "express";
import { postMedicineType, updateMedicineType } from "./seller.types";
import { sellerService } from "./seller.service";
import { string, ZodError } from "zod";

const postMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: postMedicineType = req.body;

    const result = await sellerService.postMedicineQuery(data);

    res.status(201).json({
      message: "Medicine Added Successfully",
      data: result,
    });
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // Handle other errors
    console.error("Error from controller:", error);
    return res.status(500).json({
      message: "Internal server error1",
      error: (error as Error).message || "Unknown error",
    });
  }
};


const updateMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  const data: updateMedicineType = req.body;

  try {
    const result = await sellerService.updateMedicineQuery(id as string, data);

    res.status(200).json({
      message: "Medicine updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    console.error("Error in updateMedicine:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message || "Unknown error",
    });
  }
};


const deleteMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const id = req.params.id;
    const result = await sellerService.deleteMedicineQuery(id as string)

    res.status(200).json({
      message: "Medicine deleted successfully",
      data: result
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message || "Unknown error",
    });
  }
}

const getSellerOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {


  const sellerId = req.user.id;
  console.log(sellerId)

  try {

    const result = await sellerService.getSellerOrderQuery(sellerId as string);


    if (result.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No order found"
      })
    }


    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      data: result
    })

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: (error as Error).message || "Unknown error",
    });
  }
}



export const sellerController = {
  postMedicine,
  updateMedicine,
  deleteMedicine,
  getSellerOrder
};
