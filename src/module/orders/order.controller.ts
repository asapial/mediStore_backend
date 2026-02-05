


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
            success: true,
            message: "User orders fetched successfully",
            data: result
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
            success: true,
            message: "Order details fetched successfully",
            data: result
        })

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch order details",
            error: error
        })

        // next(error);
    }
}

const orderDeleteByCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const id  = req.params.id;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Order ID is required" });
    }

    try {
        const result = await orderService.deleteOrderByCustomer(id);
        return res.status(200).json({ success: true, data: result });
    } catch (err: unknown) {
        return res
            .status(400)
            .json({ success: false, message: err instanceof Error ? err.message : "Error deleting order" });
    }
}




export const orderController = {
    createOrder,
    getUsersOrder,
    getOrderDetails,
    orderDeleteByCustomer
}