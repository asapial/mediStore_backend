import { OrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { postMedicineType, postMedicineSchema, updateMedicineType } from "./seller.types";
import { string, z, ZodError } from "zod";

const postMedicineQuery = async (data: postMedicineType, sellerId: string) => {
    try {
        console.log(sellerId)
        // 1️⃣ Validate input using Zod
        const validatedData = postMedicineSchema.parse(data);

        // 2️⃣ Transform undefined image to null for Prisma
        const prismaData = {
            ...validatedData,
            sellerId: sellerId,
            image: validatedData.image ?? null, // Prisma expects string | null
        };

        // 3️⃣ Insert into DB
        const result = await prisma.medicine.create({
            data: prismaData,
        });

        return result;
    } catch (err: unknown) {
        // 4️⃣ Properly check if it's a ZodError
        if (err instanceof ZodError) {
            const messages = err.issues.map(issue => issue.message).join(", "); // use `issues` not `errors`
            throw new Error("Validation failed: " + messages);
        }

        // 5️⃣ Re-throw other errors
        throw err;
    }
};


const updateMedicineQuery = async (id: string, data: updateMedicineType) => {
    try {

        const prismaData: any = {};

        // Only include fields if they are defined
        if (data.name !== undefined) prismaData.name = { set: data.name };
        if (data.description !== undefined) prismaData.description = { set: data.description };
        if (data.price !== undefined) prismaData.price = { set: data.price };
        if (data.stock !== undefined) prismaData.stock = { set: data.stock };
        if (data.manufacturer !== undefined) prismaData.manufacturer = { set: data.manufacturer };
        if (data.category !== undefined) prismaData.category = { set: data.category };

        // Special case for image: can be null
        if (data.image !== undefined) prismaData.image = { set: data.image };

        // Update medicine
        const result = await prisma.medicine.update({
            where: { id },
            data: prismaData
        });

        return result;
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const messages = err.issues.map((issue) => issue.message).join(", ");
            throw new Error("Validation failed: " + messages);
        }
        throw err;
    }
};

const deleteMedicineQuery = async (id: string) => {

    const result = await prisma.medicine.delete({
        where: {
            id
        }
    })

    if (!result) {
        throw new Error("Medicine not found or could not be deleted");
        return;
    }

    return result;
}


const getSellerOrderQuery = async (id: string) => {

    console.log("sessss", id)
    const orders = await prisma.order.findMany({
        include: {
            items: {
                select: {
                    id: true,
                    orderId: true,
                    medicineId: true,
                    quantity: true,
                    price: true,
                    status:true,
                    medicine: {
                        select: {
                            sellerId: true,
                            name: true
                        }
                    }

                }
            }
        }
    })

    console.log(orders)

    const filteredOrders = orders.flatMap(order => {
        const items = order.items.filter(
            item => item.medicine?.sellerId === id
        );

        if (!items.length) return []; // ❌ order removed completely

        return [{
            id: order.id,
            status: order.status,
            address: order.address,
            createdAt: order.createdAt,
            items,
        }];
    });

    return filteredOrders;

}


const getSellerStats = async (sellerId: string) => {
    const LOW_STOCK_THRESHOLD = 10;

    /* ------------------ MEDICINE STATS ------------------ */
    const [
        totalMedicines,
        outOfStockMedicines,
        lowStockMedicines,
        medicinePriceAgg,
    ] = await Promise.all([
        prisma.medicine.count({ where: { sellerId } }),

        prisma.medicine.count({
            where: { sellerId, stock: 0 },
        }),

        prisma.medicine.count({
            where: {
                sellerId,
                stock: { gt: 0, lte: LOW_STOCK_THRESHOLD },
            },
        }),

        prisma.medicine.aggregate({
            where: { sellerId },
            _avg: { price: true },
        }),
    ]);

    /* ------------------ ORDER DATA ------------------ */
    const orders = await prisma.order.findMany({
        where: {
            items: {
                some: {
                    medicine: { sellerId },
                },
            },
        },
        include: {
            items: {
                select: {
                    quantity: true,
                    price: true,
                    medicine: {
                        select: { sellerId: true },
                    },
                },
            },
        },
    });

    const totalOrders = orders.length;

    /* ------------------ SALES CALCULATION ------------------ */
    let totalSold = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
        order.items.forEach((item) => {
            if (item.medicine.sellerId === sellerId) {
                totalSold += item.quantity;
                totalRevenue += item.price * item.quantity;
            }
        });
    });

    /* ------------------ ORDER STATUS STATS ------------------ */
    const ordersByStatus = await prisma.order.groupBy({
        by: ["status"],
        where: {
            items: {
                some: {
                    medicine: { sellerId },
                },
            },
        },
        _count: true,
    });

    const completedOrders =
        ordersByStatus.find((o) => o.status === "DELIVERED")?._count || 0;

    const cancelledOrders =
        ordersByStatus.find((o) => o.status === "CANCELLED")?._count || 0;

    /* ------------------ TIME-BASED REVENUE ------------------ */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        1
    );

    const timeOrders = await prisma.order.findMany({
        where: {
            createdAt: { gte: monthStart },
            items: {
                some: {
                    medicine: { sellerId },
                },
            },
        },
        include: {
            items: {
                select: {
                    quantity: true,
                    price: true,
                    medicine: {
                        select: { sellerId: true },
                    },
                },
            },
        },
    });

    let todayRevenue = 0;
    let thisMonthRevenue = 0;

    timeOrders.forEach((order) => {
        order.items.forEach((item) => {
            if (item.medicine.sellerId === sellerId) {
                const revenue = item.quantity * item.price;
                thisMonthRevenue += revenue;

                if (order.createdAt >= todayStart) {
                    todayRevenue += revenue;
                }
            }
        });
    });

    return {
        // Medicines
        totalMedicines,
        outOfStockMedicines,
        lowStockMedicines,
        averagePrice: medicinePriceAgg._avg.price || 0,

        // Orders
        totalOrders,
        completedOrders,
        cancelledOrders,
        ordersByStatus,

        // Sales
        totalSold,
        totalRevenue,
        averageOrderValue:
            totalOrders > 0 ? totalRevenue / totalOrders : 0,

        // Time-based
        todayRevenue,
        thisMonthRevenue,
    };
};


const updateOrderItemStatusQuery = async (
    orderId: string,
    orderItemsList: string[],
    // status: OrderStatus // <- strongly typed
    status: string // <- strongly typed
) => {
    await prisma.orderItem.updateMany({
        where: {
            id: { in: orderItemsList },
            orderId,
        },
        data: {
            status:status, // ✅ pass the enum, not string
        },
    });

    const remaining = await prisma.orderItem.count({
        where: {
            orderId,
            status: { not: status },
        },
    });

    if (remaining === 0) {
        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }

    return { success: true };
};



export const sellerService = {
    postMedicineQuery,
    updateMedicineQuery,
    deleteMedicineQuery,
    getSellerOrderQuery,
    getSellerStats,
    updateOrderItemStatusQuery
};
