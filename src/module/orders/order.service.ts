import { prisma } from "../../lib/prisma";
import { CreateOrderType } from "./order.types";

const postOrderQuery = async (
    userId: string,
    data: CreateOrderType
) => {
    return await prisma.$transaction(async (tx) => {

        // 1️⃣ Fetch medicines
        const medicineIds = data.items.map((i) => i.medicineId);
        const medicines = await tx.medicine.findMany({
            where: { id: { in: medicineIds } },
        });
        if (medicines.length !== medicineIds.length) {
            throw new Error("One or more medicines not found");
        }

        // 2️⃣ Validate stock and build price snapshots
        for (const item of data.items) {
            const medicine = medicines.find((m) => m.id === item.medicineId)!;
            if (item.quantity > medicine.stock) {
                throw new Error(
                    `Insufficient stock for "${medicine.name}". Available: ${medicine.stock}, Requested: ${item.quantity}`
                );
            }
        }

        // 3️⃣ Create order
        const order = await tx.order.create({
            data: { userId, address: data.address },
        });

        // 4️⃣ Create order items with correct price snapshot
        //    flashQty units → priceOverride (flash price)
        //    remaining units → medicine.price (regular price)
        //    stored price = weighted average snapshot for the row
        const orderItemsData = data.items.map((item) => {
            const medicine  = medicines.find((m) => m.id === item.medicineId)!;
            const flashQty  = item.flashQuantity ?? 0;
            const regularQty = item.quantity - flashQty;
            const flashPrice = (flashQty > 0 && item.priceOverride != null)
                ? item.priceOverride
                : medicine.price;

            // Weighted average price per unit (used for revenue tracking)
            const priceSnapshot =
                (flashQty * flashPrice + regularQty * medicine.price) / item.quantity;

            return {
                orderId:    order.id,
                medicineId: medicine.id,
                quantity:   item.quantity,
                price:      priceSnapshot,
            };
        });

        await tx.orderItem.createMany({ data: orderItemsData });

        // 5️⃣ Decrement medicine stock for each ordered item
        await Promise.all(
            data.items.map((item) =>
                tx.medicine.update({
                    where: { id: item.medicineId },
                    data:  { stock: { decrement: item.quantity } },
                })
            )
        );

        // 6️⃣ Increment flashSale.soldCount for items that used flash pricing
        const flashItems = data.items.filter(
            (item) => (item.flashQuantity ?? 0) > 0 && item.priceOverride != null
        );
        if (flashItems.length > 0) {
            const now = new Date();
            await Promise.all(
                flashItems.map(async (item) => {
                    // Find the active flash sale for this medicine at this price
                    const flashSale = await tx.flashSale.findFirst({
                        where: {
                            medicineId:    item.medicineId,
                            discountPrice: item.priceOverride!,
                            isApproved:    true,
                            startAt:       { lte: now },
                            endAt:         { gte: now },
                        },
                    });
                    if (flashSale) {
                        await tx.flashSale.update({
                            where: { id: flashSale.id },
                            data:  { soldCount: { increment: item.flashQuantity! } },
                        });
                    }
                })
            );
        }

        return order;
    });
};

const getUserOrdersQuery = async (userId: string) => {

    const result = await prisma.order.findMany({
        where: {
            userId
        },
        include: {
            items: {
                include: {
                    medicine: {
                        select: {
                            name: true,
                            description: true,
                            price: true,
                            image: true,
                            sellerId: true
                        }
                    }
                }
            }
        }
    })

    return result;
}

const getOrderDetailsQuery = async (orderId: string) => {

    const result = await prisma.order.findUnique({
        where: {
            id: orderId
        },
        include: {
            items: {
                include: {
                    medicine: {
                        select: {
                            name: true,
                            description: true,
                            price: true,
                            image: true,
                        }
                    }
                }
            }
        }
    })

    if (!result) {
        throw new Error("Order not found");
    }

    return result;
}

const deleteOrderByCustomer = async (orderId: string) => {
    // Fetch order first
    const order = await prisma.order.findUnique({
        where: { 
            id:orderId 
        },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        throw new Error("Cannot delete delivered or cancelled orders");
    }

    // Delete the order
    await prisma.order.delete({
        where: { id: orderId },
    });

    return { message: "Order deleted successfully" };
}

const getCustomerStats = async (userId: string) => {
    const [orders, wishlistCount] = await Promise.all([
        prisma.order.findMany({
            where: { userId },
            include: { items: { select: { price: true, quantity: true } } },
        }),
        prisma.wishlist.count({ where: { userId } }),
    ]);

    const totalOrders    = orders.length;
    const deliveredCount = orders.filter(o => o.status === "DELIVERED").length;
    const activeCount    = orders.filter(o =>
        ["PLACED", "PROCESSING", "SHIPPED", "CONFIRMED"].includes(o.status)
    ).length;
    const totalSpent     = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0
    );

    return { totalOrders, deliveredCount, activeCount, totalSpent, wishlistCount };
};


export const orderService = {
    postOrderQuery,
    getUserOrdersQuery,
    getOrderDetailsQuery,
    deleteOrderByCustomer,
    getCustomerStats,
}