import { Request, Response, NextFunction } from "express";
import { postMedicineType, updateMedicineType } from "./seller.types";
import { sellerService } from "./seller.service";
import { string, ZodError } from "zod";
import { OrderStatus } from "../../../generated/prisma/enums";

const postMedicine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: postMedicineType = req.body;

    const sellerId= req.user.id;

    console.log(sellerId)

    const result = await sellerService.postMedicineQuery(data,sellerId as string);

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


const sellerStatController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user?.id; // assume auth middleware sets req.user
    if (!sellerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const stats = await sellerService.getSellerStats(sellerId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};


const updateOrderItemStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, orderItemIds, status } = req.body;

    console.log(orderId, orderItemIds,status)

    // 🧪 Basic validation
    if (!orderId || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderId and orderItemIds are required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

// const validStatuses: OrderStatus[] = [
//   "PLACED",
//   "CONFIRMED",
//   "SHIPPED",
//   "DELIVERED",
//   "CANCELLED",
// ];

// if (!validStatuses.includes(status)) {
//   return res.status(400).json({
//     success: false,
//     message: "Invalid order status",
//   });
// }


    // 🔁 Call service layer
    const result = await sellerService.updateOrderItemStatusQuery(
      orderId,
      orderItemIds,
      status as OrderStatus
    );

    return res.status(200).json({
      success: true,
      message: "Order item status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
export const sellerController = {
  postMedicine,
  updateMedicine,
  deleteMedicine,
  getSellerOrder,
  sellerStatController,
  updateOrderItemStatus
};
