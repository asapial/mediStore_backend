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

        // 4️⃣ Create sub-orders per seller
        const sellerItems = data.items.reduce((acc, item) => {
            const medicine = medicines.find((m) => m.id === item.medicineId)!;
            if (!acc[medicine.sellerId]) acc[medicine.sellerId] = [];
            acc[medicine.sellerId].push({ ...item, medicine });
            return acc;
        }, {} as Record<string, (typeof data.items[0] & { medicine: any })[]>);

        for (const sellerId in sellerItems) {
            // Build price snapshots first so we can compute the total
            const itemRows = sellerItems[sellerId].map((item) => {
                const flashQty   = item.flashQuantity ?? 0;
                const regularQty = item.quantity - flashQty;
                const flashPrice = (flashQty > 0 && item.priceOverride != null)
                    ? item.priceOverride : item.medicine.price;
                const priceSnapshot =
                    (flashQty * flashPrice + regularQty * item.medicine.price) / item.quantity;
                return { medicineId: item.medicineId, quantity: item.quantity, price: priceSnapshot };
            });

            const subTotal = itemRows.reduce((s, r) => s + r.price * r.quantity, 0);

            // Create SubOrder with correct total (used for wallet credit on delivery)
            const subOrder = await tx.subOrder.create({
                data: { orderId: order.id, sellerId, total: subTotal, status: "PLACED" },
            });

            // Create OrderItems linked to this SubOrder
            await tx.orderItem.createMany({
                data: itemRows.map((r) => ({ ...r, orderId: order.id, subOrderId: subOrder.id })),
            });
        }

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
    return prisma.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    medicine: {
                        select: { name: true, description: true, price: true, image: true, sellerId: true }
                    }
                }
            },
            subOrders: {
                include: {
                    seller: { select: { id: true, name: true, email: true } },
                    items: {
                        include: {
                            medicine: { select: { id: true, name: true, price: true, image: true } }
                        }
                    }
                }
            },
        },
        orderBy: { createdAt: "desc" },
    });
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