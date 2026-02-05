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

        // 2️⃣ Create order
        const order = await tx.order.create({
            data: {
                userId,
                address: data.address,
            },
        });

        // 3️⃣ Create order items
        const orderItemsData = data.items.map((item) => {
            const medicine = medicines.find((m) => m.id === item.medicineId)!;

            return {
                orderId: order.id,
                medicineId: medicine.id,
                quantity: item.quantity,
                price: medicine.price, // price snapshot
            };
        });

        await tx.orderItem.createMany({
            data: orderItemsData,
        });

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





export const orderService = {
    postOrderQuery,
    getUserOrdersQuery,
    getOrderDetailsQuery,
    deleteOrderByCustomer
}