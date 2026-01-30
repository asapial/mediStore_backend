


import { Request, Response, NextFunction } from "express";
import { createOrderSchema } from "./order.types";
import { orderService } from "./order.service";
import { success } from "zod";


const createOrder = async (
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

const getUsersOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const userId = req.user.id;
    try {

        const result = await orderService.getUserOrdersQuery(userId as string);

        res.status(200).json({
            success:true,
            message:"User orders fetched successfully",
            data:result
        })

    } catch (error) {
        next(error);
    }
}

const getOrderDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const orderId = req.params.id;
    try {

        const result = await orderService.getOrderDetailsQuery(orderId as string);

        res.status(200).json({
            success:true,
            message:"Order details fetched successfully",
            data:result
        })

    } catch (error) {

        res.status(500).json({
            success:false,
            message:"Failed to fetch order details",
            error:error
        })

        // next(error);
    }
}




export const orderController = {
    createOrder,
    getUsersOrder,
    getOrderDetails
}