import { Request, Response } from "express";
import { catchAsync }       from "../../utils/catchAsync";
import { sendResponse }     from "../../utils/sendResponse";
import { dashboardService } from "./dashboard.service";

// GET /api/dashboard  — role determines what data is returned
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user?.id || !user?.role) {
        return sendResponse(res, {
            status:  401,
            success: false,
            message: "Unauthorized — please log in",
        });
    }

    let data: unknown;

    if (user.role === "ADMIN") {
        data = await dashboardService.getAdminDashboardService();
    } else if (user.role === "SELLER") {
        data = await dashboardService.getSellerDashboardService(user.id);
    } else {
        // CUSTOMER (default)
        data = await dashboardService.getCustomerDashboardService(user.id);
    }

    return sendResponse(res, {
        status:  200,
        success: true,
        message: `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} dashboard stats fetched successfully`,
        data,
    });
});

export const dashboardController = { getDashboardStats };
