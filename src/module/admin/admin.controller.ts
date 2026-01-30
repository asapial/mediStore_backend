import { NextFunction, Request, Response } from "express";
import { adminService } from "./admin.service"
import { updatedCategoryType, updateUserType } from "./admin.types";

const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const result = await adminService.getAllUsersQuery();

        if (result.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No users found"
            })
        }


        res.status(200).json({
            status: true,
            message: "Users fetched successfully",
            data: result
        })
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error
        })
    }
}

const getUserDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {


    try {

        const userId = req.params.id;

        const result = await adminService.getUserDetailsQuery(userId as string);

        res.status(200).json({
            status: true,
            message: "User fetched successfully",
            data: result
        })
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error
        })
    }

}

const getAllCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const result = await adminService.getAllCategoryQuery();

        if (result.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No categories found"
            })
        }

        res.status(200).json({
            status: true,
            message: "Categories fetched successfully",
            data: result
        })
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error
        })
    }
}

const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {


    try {

        const userId = req.params.id;
        const updatedData = req.body;

        const result = await adminService.updateUserQuery(userId as string, updatedData as updateUserType);

        res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: result
        })
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error
        })
    }

}

const updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const categoryId = req.params.id;
        const updatedData = req.body;

        const result = await adminService.updateCategoryQuery(categoryId as string, updatedData );

        res.status(200).json({
            status: true,
            message: "Category updated successfully",
            data: result
        })
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error
        })
    }


}



export const adminController = {
    getAllUsers,
    getAllCategory,
    updateUser,
    updateCategory,
    getUserDetails
}