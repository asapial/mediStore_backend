import { prisma } from "../../lib/prisma";

// ─── Admin Dashboard Stats ────────────────────────────────────────────────────
const getAdminDashboardService = async () => {
    const [
        totalUsers, totalCustomers, totalSellers, totalAdmins,
        totalMedicines,
        totalOrders, placedOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders,
        totalCartItems, totalCartQtyAgg,
        totalReviews, avgRatingAgg,
        revenueAgg,
        pendingLicenses,
        recentOrders,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.medicine.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PLACED" } }),
        prisma.order.count({ where: { status: "PROCESSING" } }),
        prisma.order.count({ where: { status: "SHIPPED" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.order.count({ where: { status: "CANCELLED" } }),
        prisma.cartItem.count(),
        prisma.cartItem.aggregate({ _sum: { quantity: true } }),
        prisma.review.count(),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.orderItem.aggregate({ _sum: { price: true } }),
        prisma.sellerLicense.count({ where: { status: "PENDING" } }),
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                items: { select: { price: true, quantity: true } },
            },
        }),
    ]);

    const totalRevenue = revenueAgg._sum.price ?? 0;

    const recentOrdersMapped = recentOrders.map(o => ({
        id:        o.id,
        status:    o.status,
        createdAt: o.createdAt,
        customer:  (o as any).user?.name ?? "Unknown",
        total:     (o as any).items?.reduce((s: number, i: any) => s + i.price * (i.quantity ?? 1), 0) ?? 0,
    }));

    return {
        users:     { total: totalUsers, customers: totalCustomers, sellers: totalSellers, admins: totalAdmins },
        medicines: { total: totalMedicines },
        orders:    { total: totalOrders, placed: placedOrders, processing: processingOrders, shipped: shippedOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
        cart:      { totalItems: totalCartItems, totalQuantity: totalCartQtyAgg._sum.quantity ?? 0 },
        reviews:   { total: totalReviews, averageRating: Number((avgRatingAgg._avg.rating ?? 0).toFixed(2)) },
        revenue:   { total: totalRevenue },
        pendingLicenses,
        recentOrders: recentOrdersMapped,
    };
};

// ─── Seller Dashboard Stats ───────────────────────────────────────────────────
const getSellerDashboardService = async (sellerId: string) => {
    const LOW_STOCK_THRESHOLD = 10;

    const [
        totalMedicines, outOfStock, lowStock, avgPriceAgg,
        allOrders,
        ordersByStatusRaw,
        lowStockMeds,
        recentOrders,
    ] = await Promise.all([
        prisma.medicine.count({ where: { sellerId } }),
        prisma.medicine.count({ where: { sellerId, stock: 0 } }),
        prisma.medicine.count({ where: { sellerId, stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
        prisma.medicine.aggregate({ where: { sellerId }, _avg: { price: true }, _sum: { stock: true } }),
        prisma.order.findMany({
            where: { items: { some: { medicine: { sellerId } } } },
            include: { items: { select: { quantity: true, price: true, medicine: { select: { sellerId: true } } } } },
        }),
        prisma.order.groupBy({
            by: ["status"],
            where: { items: { some: { medicine: { sellerId } } } },
            _count: true,
        }),
        prisma.medicine.findMany({
            where: { sellerId, stock: { lte: LOW_STOCK_THRESHOLD } },
            orderBy: { stock: "asc" },
            take: 5,
            select: { id: true, name: true, stock: true, price: true, category: { select: { name: true } } },
        }),
        prisma.order.findMany({
            where: { items: { some: { medicine: { sellerId } } } },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true } },
                items: { select: { price: true, quantity: true, medicine: { select: { sellerId: true } } } },
            },
        }),
    ]);

    let totalRevenue = 0, totalSold = 0;
    allOrders.forEach(o => o.items.forEach(i => {
        if (i.medicine.sellerId === sellerId) { totalRevenue += i.price * i.quantity; totalSold += i.quantity; }
    }));

    const completedOrders = ordersByStatusRaw.find(o => o.status === "DELIVERED")?._count ?? 0;
    const cancelledOrders = ordersByStatusRaw.find(o => o.status === "CANCELLED")?._count ?? 0;
    const totalOrders     = allOrders.length;

    // Today / this month
    const todayStart  = new Date(); todayStart.setHours(0, 0, 0, 0);
    const monthStart  = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    let todayRevenue = 0, thisMonthRevenue = 0;
    allOrders.forEach(o => {
        let orderRev = 0;
        o.items.forEach(i => { if (i.medicine.sellerId === sellerId) orderRev += i.price * i.quantity; });
        if (o.createdAt >= monthStart)  thisMonthRevenue += orderRev;
        if (o.createdAt >= todayStart)  todayRevenue     += orderRev;
    });

    return {
        medicines: {
            total: totalMedicines, outOfStock, lowStock,
            averagePrice: Number((avgPriceAgg._avg.price ?? 0).toFixed(2)),
            totalStock:   avgPriceAgg._sum.stock ?? 0,
        },
        orders: {
            total: totalOrders, completed: completedOrders, cancelled: cancelledOrders,
            byStatus: ordersByStatusRaw.map(o => ({ status: o.status, count: o._count })),
        },
        revenue: {
            total: Number(totalRevenue.toFixed(2)),
            thisMonth: Number(thisMonthRevenue.toFixed(2)),
            today:     Number(todayRevenue.toFixed(2)),
            averageOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
        },
        sales: { totalSold },
        lowStockAlerts: lowStockMeds,
        recentOrders: recentOrders.map(o => ({
            id:        o.id,
            status:    o.status,
            createdAt: o.createdAt,
            customer:  (o as any).user?.name ?? "Unknown",
            total:     o.items.filter(i => i.medicine.sellerId === sellerId).reduce((s, i) => s + i.price * i.quantity, 0),
        })),
    };
};

// ─── Customer Dashboard Stats ─────────────────────────────────────────────────
const getCustomerDashboardService = async (userId: string) => {
    const [orders, wishlistItemCount, wallet, prescriptions] = await Promise.all([
        prisma.order.findMany({
            where: { userId },
            include: { items: { select: { price: true, quantity: true, medicine: { select: { name: true, image: true } } } } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.wishlistItem.count({
            where: { wishlist: { userId } },
        }),
        prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
        prisma.prescription.count({ where: { userId } }),
    ]);

    const totalOrders    = orders.length;
    const deliveredCount = orders.filter(o => o.status === "DELIVERED").length;
    const activeCount    = orders.filter(o => ["PLACED", "PROCESSING", "SHIPPED", "CONFIRMED"].includes(o.status)).length;
    const totalSpent     = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);

    const recentOrders = orders.slice(0, 5).map(o => ({
        id:        o.id,
        status:    o.status,
        createdAt: o.createdAt,
        total:     o.items.reduce((s, i) => s + i.price * i.quantity, 0),
        itemCount: o.items.length,
    }));

    return {
        orders: { total: totalOrders, delivered: deliveredCount, active: activeCount },
        spending: { total: Number(totalSpent.toFixed(2)) },
        wallet:   { balance: Number((wallet?.balance ?? 0).toFixed(2)) },
        wishlist: { count: wishlistItemCount },
        prescriptions: { total: prescriptions },
        recentOrders,
    };
};

export const dashboardService = {
    getAdminDashboardService,
    getSellerDashboardService,
    getCustomerDashboardService,
};
