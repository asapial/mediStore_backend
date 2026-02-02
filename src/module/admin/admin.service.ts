import { tr } from "zod/v4/locales";
import { prisma } from "../../lib/prisma"
import { updatedCategoryType, updateUserType } from "./admin.types";

type UpdateUserPayload = {
    name?: string;
    role?: "CUSTOMER" | "SELLER" | "ADMIN";
};


const getAllUsersQuery = async () => {

    const result = await prisma.user.findMany({

    });

    return result;
}

const getAllCategoryQuery = async () => {

    const result = await prisma.category.findMany();

    return result;
}

const getUserDetailsQuery = async (userId: string) => {

    const result = await prisma.user.findUnique({
        where: {
            id: userId
        },
        include: {
            orders: true
        }
    })

    return result;
}

const updateUserQuery = async (userId: string, updatedData: updateUserType) => {

    const isPresent = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })

    if (!isPresent) {
        throw new Error("User not found");
    }


    if (updatedData.image === undefined) {
        updatedData.image = null;
    }
    const result = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            name: updatedData.name,
            email: updatedData.email,
            image: updatedData.image
        }
    })

    return result;
}


const updateCategoryQuery = async (categoryId: string, updatedData: updatedCategoryType) => {

    const isPresent = await prisma.category.findUnique({
        where: {
            id: categoryId
        }
    })

    if (!isPresent) {
        throw new Error("Category not found");
    }

    const result = await prisma.category.update({
        where: {
            id: categoryId
        },
        data: {
            name: updatedData.name
        }
    })

    return result;
}

const getAdminStatsService = async () => {
    // 1. Total users by role
    const totalUsers = await prisma.user.count();
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalSellers = await prisma.user.count({ where: { role: "SELLER" } });
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });

    // 2. Total medicines
    const totalMedicines = await prisma.medicine.count();

    // 3. Total orders & orders by status
    const totalOrders = await prisma.order.count();
    const placedOrders = await prisma.order.count({ where: { status: "PLACED" } });
    const processingOrders = await prisma.order.count({ where: { status: "PROCESSING" } });
    const shippedOrders = await prisma.order.count({ where: { status: "SHIPPED" } });
    const deliveredOrders = await prisma.order.count({ where: { status: "DELIVERED" } });
    const cancelledOrders = await prisma.order.count({ where: { status: "CANCELLED" } });

    // 4. Total cart items & total quantity in all carts
    const totalCartItems = await prisma.cartItem.count();
    const totalCartQuantity = await prisma.cartItem.aggregate({
        _sum: { quantity: true },
    });

    // 5. Total reviews & average rating
    const totalReviews = await prisma.review.count();
    const averageRating = await prisma.review.aggregate({
        _avg: { rating: true },
    });

    return {
        users: { total: totalUsers, customers: totalCustomers, sellers: totalSellers, admins: totalAdmins },
        medicines: { total: totalMedicines },
        orders: {
            total: totalOrders,
            placed: placedOrders,
            processing: processingOrders,
            shipped: shippedOrders,
            delivered: deliveredOrders,
            cancelled: cancelledOrders,
        },
        cart: { totalItems: totalCartItems, totalQuantity: totalCartQuantity._sum.quantity || 0 },
        reviews: { total: totalReviews, averageRating: averageRating._avg.rating || 0 },
    };
};

const getAllOrder = async () => {

    const result = await prisma.order.findMany({
        include: {
            items: {
                select: {
                    id: true,
                    medicineId: true,
                    quantity: true,
                    status: true,
                    price: true,
                    medicine: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            manufacturer: true,
                            seller: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    return result;
}


const banUserService = async (userId: string, ban: boolean) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: ban,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserByAdmin = async (
  userId: string,
  payload: UpdateUserPayload
) => {
  const data: any = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.role !== undefined) {
    data.role = payload.role;
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      updatedAt: true,
    },
  });
};



export const adminService = {
    getAllUsersQuery,
    getAllCategoryQuery,
    updateUserQuery,
    updateCategoryQuery,
    getUserDetailsQuery,
    getAdminStatsService,
    getAllOrder,
    banUserService,
    updateUserByAdmin
}