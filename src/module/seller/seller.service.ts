import { OrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { postMedicineType, postMedicineSchema, updateMedicineType } from "./seller.types";
import { string, z, ZodError } from "zod";
import { ensureFulfillmentTask } from "../subOrder/subOrder.service";

const postMedicineQuery = async (data: postMedicineType, sellerId: string) => {
    try {
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
            data: {
              ...prismaData,
              discountPrice: validatedData.discountPrice ?? null,
            },
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
        if (data.discountPrice !== undefined) prismaData.discountPrice = { set: data.discountPrice };
        if (data.stock !== undefined) prismaData.stock = { set: data.stock };
        if (data.manufacturer !== undefined) prismaData.manufacturer = { set: data.manufacturer };
        if (data.categoryId !== undefined) prismaData.categoryId = { set: data.categoryId };
        if (data.requiresPrescription !== undefined) prismaData.requiresPrescription = { set: data.requiresPrescription };
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
    const orders = await prisma.order.findMany({
        include: {
            user: { select: { name: true, email: true } },
            items: {
                select: {
                    id: true, orderId: true, medicineId: true,
                    quantity: true, price: true, status: true,
                    subOrderId: true,
                    medicine: { select: { sellerId: true, name: true, image: true } },
                }
            },
            // Include SubOrders so the frontend knows which flow to use
            subOrders: {
                where: { sellerId: id },
                include: {
                    items: {
                        include: {
                            medicine: { select: { id: true, name: true, image: true, price: true } }
                        }
                    }
                }
            },
            // Include FulfillmentTask + Warehouse so seller knows where to ship
            fulfillmentTask: {
                include: {
                    warehouse: {
                        select: {
                            id: true, name: true, address: true, city: true,
                            country: true, phone: true,
                            manager: { select: { name: true, email: true } },
                        }
                    }
                }
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const filteredOrders = orders.flatMap(order => {
        const items = order.items.filter(item => item.medicine?.sellerId === id);
        if (!items.length) return [];

        return [{
            id:              order.id,
            status:          order.status,
            address:         order.address,
            createdAt:       order.createdAt,
            user:            { name: (order as any).user?.name ?? "—", email: (order as any).user?.email ?? "—" },
            items,
            subOrders:       (order as any).subOrders ?? [],
            fulfillmentTask: (order as any).fulfillmentTask ?? null,
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
    status: string
) => {
    // Update item statuses
    await prisma.orderItem.updateMany({
        where: { id: { in: orderItemsList }, orderId },
        data: { status },
    });

    // If all items in the order share the same status → promote the parent order
    const remaining = await prisma.orderItem.count({
        where: { orderId, status: { not: status } },
    });
    if (remaining === 0) {
        await prisma.order.update({ where: { id: orderId }, data: { status } });

        // ── When all items are SHIPPED → auto-create FulfillmentTask ────────────
        // Covers orders placed BEFORE the SubOrder refactor (no SubOrder records)
        if (status === "SHIPPED") {
            await ensureFulfillmentTask(orderId);
        }
    }

    return { success: true };
};



const getInventoryQuery = async (sellerId: string) => {
    return await prisma.medicine.findMany({
        where: { sellerId },
        include: {
            batches: true,
            stockAlert: true,
            expiryAlerts: true
        },
        orderBy: { createdAt: 'desc' }
    });
};



export const sellerService = {
    postMedicineQuery,
    updateMedicineQuery,
    deleteMedicineQuery,
    getSellerOrderQuery,
    getSellerStats,
    updateOrderItemStatusQuery,
    getInventoryQuery
};
