import { NextFunction, Request, Response } from "express";
import { cartService } from "./cart.service";

const addToCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { medicineId, quantity } = req.body;
    console.log(medicineId,quantity)

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: "medicineId is required",
      });
    }

    // Assuming req.user.id is set from auth middleware
    const userId = req.user.id;

    const cartItem = await cartService.addToCartService(userId, medicineId, quantity || 1);

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: cartItem,
    });
  } catch (error) {
    next(error);
  }
};

const getMedicineCartStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user
    const medicineId = req.params.medicineId;

    if (!userId || !medicineId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Medicine ID are required",
      });
    }

    const status = await cartService.getMedicineCartStatus(userId, medicineId as string);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
};

 const getFromCartController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id; // Assuming you set req.user from session or auth middleware
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cart = await cartService.getFromCartService(userId);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined) {
      return res.status(400).json({ success: false, message: "itemId and quantity are required" });
    }

    const updatedItem = await cartService.updateCartItemService(userId, itemId, quantity);

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItemController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "itemId is required" });
    }

    const result = await cartService.removeCartItemService(userId, itemId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const cartController={
addToCartController,
getMedicineCartStatusController,
getFromCartController,
updateCartItemController,
removeCartItemController
}