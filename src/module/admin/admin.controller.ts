import { NextFunction, Request, Response } from "express";
import { adminService } from "./admin.service"

const getAllUsers =async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        
        const result = await adminService.getAllUsersQuery();

        if(result.length===0){
            return res.status(404).json({
                status:false,
                message:"No users found"
            })
        }


        res.status(200).json({
            status:true,
            message:"Users fetched successfully",
            data:result
        })
    } catch (error) {
        
        return res.status(500).json({
            status:false,
            message:"Internal server error",
            error:error
        })
    }
}

const getAllCategory =async (
    req: Request,
    res: Response,
    next: NextFunction
) => {


}


const updateUser =async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    
}


const updateCategory =async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    
}



export const adminController={
getAllUsers,
getAllCategory,
updateUser,
updateCategory
}