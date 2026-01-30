import { prisma } from "../../lib/prisma"
import {  updatedCategoryType, updateUserType } from "./admin.types";

const getAllUsersQuery=  async ()=>{

    const result= await prisma.user.findMany({
    
    });

    return result;
}

const getAllCategoryQuery=  async ()=>{

    const result= await prisma.category.findMany();

    return result;
}

const getUserDetailsQuery= async (userId:string)=>{

    const result = await prisma.user.findUnique({
        where:{
            id:userId
        },
        include:{
            orders:true
        }
    })

    return result;
}

const updateUserQuery= async (userId:string,updatedData:updateUserType)=>{

    const isPresent= await prisma.user.findUnique({
        where:{
            id:userId
        }
    })  

    if(!isPresent){
        throw new Error("User not found");
    }


    if(updatedData.image===undefined){
        updatedData.image=null;
    }
    const result = await prisma.user.update({
        where:{
            id:userId
        },
        data:{
            name:updatedData.name,
            email:updatedData.email,
            image:updatedData.image
        }
    })

    return result;
}


const updateCategoryQuery= async (categoryId:string,updatedData:updatedCategoryType)=>{

    const isPresent= await prisma.category.findUnique({
        where:{
            id:categoryId
        }
    })  

    if(!isPresent){
        throw new Error("Category not found");
    }

    const result = await prisma.category.update({
        where:{
            id:categoryId
        },
        data:{
            name:updatedData.name
        }
    })

    return result;
}






export const adminService={
getAllUsersQuery,
getAllCategoryQuery,
updateUserQuery,
updateCategoryQuery,
getUserDetailsQuery
}