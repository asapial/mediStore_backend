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

const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: false,
        message: "Category name is required",
      });
    }

    const result = await adminService.createCategoryQuery(name);

    res.status(201).json({
      status: true,
      message: "Category created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
};

const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await adminService.deleteCategoryQuery(id as string);

    res.status(200).json({
      status: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
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

        const result = await adminService.updateCategoryQuery(categoryId as string, updatedData);

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

const getAdminStatsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {


        const stats = await adminService.getAdminStatsService();

        res.status(200).json({
            success: true,
            message: "Admin stats fetched successfully",
            data: stats,
        });
    } catch (err) {
        next(err);
    }
};

const getAllOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {


    try {


        const order = await adminService.getAllOrder();

        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: order,
        });
    } catch (err) {
        next(err);
    }
}

const banUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { userId } = req.params;
    const { ban } = req.body;

    if (typeof ban !== "boolean") {
      return res.status(400).json({ message: "Ban must be boolean" });
    }

    const user = await adminService.banUserService(userId as string, ban);

    res.status(200).json({
      success: true,
      message: ban ? "User banned successfully" : "User unbanned successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


const adminUpdateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const { name, role } = req.body;

        if (!name && !role) {
            return res.status(400).json({
                status: false,
                message: "Nothing to update",
            });
        }

        const user = await adminService.updateUserByAdmin(userId as string, { name, role });

        return res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: error.message || "Failed to update user",
        });
    }
};


export const adminController = {
    getAllUsers,
    getAllCategory,
    updateUser,
    updateCategory,
    getUserDetails,
    getAdminStatsController,
    getAllOrder,
    banUserController,
    adminUpdateUser,
    createCategory,
    deleteCategory
}