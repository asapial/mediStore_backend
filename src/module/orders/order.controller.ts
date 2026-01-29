


import { Request, Response, NextFunction } from "express";
import { createOrderSchema } from "./order.types";
import { orderService } from "./order.service";


export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id; // from auth middleware
    const validatedData = createOrderSchema.parse(req.body);

    const result = await orderService.postOrderQuery(userId, validatedData);

    res.status(201).json({
      message: "Order placed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};






export const orderController={
createOrder
}