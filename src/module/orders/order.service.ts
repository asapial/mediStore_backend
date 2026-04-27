import { prisma } from "../../lib/prisma";
import { CreateOrderType } from "./order.types";
import { extractCoordsFromBDAddress, haversineKm } from "../../utils/bdGeo";

// ─── Resolve nearest active warehouse to a free-text BD address ───────────────
async function nearestWarehouse(address: string) {
    const whs = await prisma.warehouse.findMany({ where: { isActive: true } });
    if (!whs.length) return null;
    if (whs.length === 1) return whs[0]!;

    // 1️⃣ Try GPS(lat,lng) embedded pattern — must run BEFORE split-by-comma parsing
    //    because extractCoordsFromBDAddress splits on commas, breaking GPS coords.
    let coords: { lat: number; lng: number } | null = null;
    const gpsMatch = address.match(/GPS\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    if (gpsMatch) {
        coords = { lat: parseFloat(gpsMatch[1]!), lng: parseFloat(gpsMatch[2]!) };
    } else {
        // 2️⃣ Fall back to district/division name parsing
        coords = extractCoordsFromBDAddress(address);
    }

    if (!coords) return whs[0]!;

    // 3️⃣ Haversine with null-safe warehouse coordinates.
    //    Warehouses without lat/lng get Infinity distance so they never win
    //    unless ALL warehouses lack coordinates (in which case the first is used).
    return whs.reduce((best, wh) => {
        const distWh   = (wh.lat != null && wh.lng != null)
            ? haversineKm(coords!.lat, coords!.lng, wh.lat, wh.lng)
            : Infinity;
        const distBest = (best.lat != null && best.lng != null)
            ? haversineKm(coords!.lat, coords!.lng, best.lat, best.lng)
            : Infinity;
        return distWh < distBest ? wh : best;
    });
}

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

        // 2️⃣ Validate stock
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

        // ✅ FIX #8: Write PLACED tracking event at order creation
        await tx.orderTracking.create({
            data: {
                orderId: order.id,
                status:  "PLACED",
                note:    "Order placed successfully. Processing your items.",
            },
        });

        // 4️⃣ Resolve destination warehouse (customer's nearest)
        const destWarehouse = await nearestWarehouse(data.address);

        // 5️⃣ Create sub-orders per seller
        const sellerItems = data.items.reduce((acc, item) => {
            const medicine = medicines.find((m) => m.id === item.medicineId)!;
            if (!acc[medicine.sellerId]) acc[medicine.sellerId] = [];
            acc[medicine.sellerId]!.push({ ...item, medicine });
            return acc;
        }, {} as Record<string, (typeof data.items[0] & { medicine: any })[]>);

        for (const sellerId in sellerItems) {
            const itemRows = (sellerItems[sellerId] ?? []).map((item) => {
                const flashQty   = item.flashQuantity ?? 0;
                const regularQty = item.quantity - flashQty;
                const flashPrice = (flashQty > 0 && item.priceOverride != null)
                    ? item.priceOverride : item.medicine.price;
                const priceSnapshot =
                    (flashQty * flashPrice + regularQty * item.medicine.price) / item.quantity;
                return { medicineId: item.medicineId, quantity: item.quantity, price: priceSnapshot };
            });

            const subTotal = itemRows.reduce((s, r) => s + r.price * r.quantity, 0);

            const seller = await tx.user.findUnique({
                where: { id: sellerId },
                select: { businessCity: true },
            });
            const originWarehouse = seller?.businessCity
                ? await nearestWarehouse(seller.businessCity)
                : destWarehouse;

            const subOrder = await tx.subOrder.create({
                data: {
                    orderId:           order.id,
                    sellerId,
                    total:             subTotal,
                    status:            "PLACED",
                    originWarehouseId: originWarehouse?.id ?? destWarehouse?.id ?? null,
                },
            });

            await tx.orderItem.createMany({
                data: itemRows.map((r) => ({ ...r, orderId: order.id, subOrderId: subOrder.id })),
            });

            if (destWarehouse) {
                await tx.shipmentLeg.create({
                    data: {
                        orderId:           order.id,
                        subOrderId:        subOrder.id,
                        originWarehouseId: originWarehouse?.id ?? destWarehouse.id,
                        destWarehouseId:   destWarehouse.id,
                        status:            "SELLER_PREPARING",
                    },
                });
            }
        }

        // 6️⃣ Decrement medicine stock
        await Promise.all(
            data.items.map((item) =>
                tx.medicine.update({
                    where: { id: item.medicineId },
                    data:  { stock: { decrement: item.quantity } },
                })
            )
        );

        // 7️⃣ Increment flashSale.soldCount for flash-priced items
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
                    },
                    shipmentLeg: {
                        select: {
                            id: true, status: true,
                            arrivedAtOriginAt: true,
                            dispatchedAt:      true,
                            arrivedAtDestAt:   true,
                            originWarehouse: { select: { id: true, name: true, city: true } },
                            destWarehouse:   { select: { id: true, name: true, city: true } },
                        }
                    },
                }
            },
            fulfillmentTask: {
                select: {
                    id: true, status: true,
                    startedAt: true, packedAt: true, dispatchedAt: true,
                    warehouse: { select: { id: true, name: true, city: true } },
                }
            },
            tracking: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
    });
}

const getOrderDetailsQuery = async (orderId: string) => {
    const result = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    medicine: {
                        select: { name: true, description: true, price: true, image: true }
                    }
                }
            },
            tracking: { orderBy: { createdAt: "asc" } },
        }
    });

    if (!result) throw new Error("Order not found");
    return result;
}

const deleteOrderByCustomer = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        throw new Error("Cannot delete delivered or cancelled orders");
    }
    await prisma.order.delete({ where: { id: orderId } });
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