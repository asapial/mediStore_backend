import {
  TransactionType,
  __commonJS,
  __esm,
  init_enums,
  init_prisma,
  prisma
} from "./chunk-LWFV7FMU.mjs";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
var auth;
var init_auth = __esm({
  "src/lib/auth.ts"() {
    "use strict";
    init_prisma();
    auth = betterAuth({
      trustedOrigins: ["https://medi-store-frontend-khaki.vercel.app", "http://localhost:3000"],
      database: prismaAdapter(prisma, {
        provider: "postgresql"
        // or "mysql", "postgresql", ...etc
      }),
      emailAndPassword: {
        enabled: true
      },
      user: {
        additionalFields: {
          role: {
            type: ["CUSTOMER", "SELLER", "ADMIN", "WAREHOUSE"],
            required: false,
            defaultValue: "CUSTOMER",
            input: true
            // ✅ allow client to pass role during sign-up
          }
        }
      },
      databaseHooks: {
        user: {
          create: {
            before: async (user) => {
              const role = user.role;
              if (role === "ADMIN" || role === "WAREHOUSE" || !["CUSTOMER", "SELLER"].includes(role)) {
                return { data: { ...user, role: "CUSTOMER" } };
              }
              return { data: user };
            }
          }
        }
      },
      // advanced:{
      //     defaultCookieAttributes:{
      //         sameSite:"none",
      //         secure:false,
      //         httpOnly:false
      //     }
      // }
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60
          // 5 minutes
        }
      },
      advanced: {
        cookiePrefix: "better-auth",
        useSecureCookies: process.env.NODE_ENV === "production",
        crossSubDomainCookies: {
          enabled: false
        },
        disableCSRFCheck: true,
        defaultCookieAttributes: {
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: false
        }
      }
    });
  }
});

// src/module/seller/seller.types.ts
import { z } from "zod";
var postMedicineSchema, updateMedicineSchema;
var init_seller_types = __esm({
  "src/module/seller/seller.types.ts"() {
    "use strict";
    postMedicineSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z.string().min(5, "Description must be at least 5 characters"),
      image: z.string().url("Invalid image URL").nullable().optional(),
      price: z.number().positive("Price must be greater than 0"),
      discountPrice: z.number().positive().nullable().optional(),
      stock: z.number().int().nonnegative("Stock must be 0 or more"),
      manufacturer: z.string().min(2, "Manufacturer must be at least 2 characters"),
      categoryId: z.string().min(1, "Category ID is required")
    });
    updateMedicineSchema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().min(5).optional(),
      image: z.string().url().nullable().optional(),
      price: z.number().positive().optional(),
      discountPrice: z.number().positive().nullable().optional(),
      stock: z.number().int().nonnegative().optional(),
      manufacturer: z.string().min(2).optional(),
      categoryId: z.string().min(1).optional(),
      requiresPrescription: z.boolean().optional(),
      category: z.array(z.string().min(1)).optional()
    });
  }
});

// src/errorHelpers/AppError.ts
var AppError, AppError_default;
var init_AppError = __esm({
  "src/errorHelpers/AppError.ts"() {
    "use strict";
    AppError = class extends Error {
      statusCode;
      constructor(statusCode, message, stack = "") {
        super(message);
        this.statusCode = statusCode;
        if (stack) {
          this.stack = stack;
        } else {
          Error.captureStackTrace(this, this.constructor);
        }
      }
    };
    AppError_default = AppError;
  }
});

// src/utils/bdGeo.ts
function extractCoordsFromBDAddress(rawAddress) {
  const parts = rawAddress.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
  const cleaned = parts[parts.length - 1] === "bangladesh" ? parts.slice(0, -1) : parts;
  if (!cleaned.length) return null;
  const len = cleaned.length;
  const candidates = [
    len >= 2 ? cleaned[len - 2] : null,
    // district slot
    cleaned[len - 1],
    // division slot
    len >= 3 ? cleaned[len - 3] : null
    // thana/upazila (sometimes same as district)
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (DISTRICTS[c]) return DISTRICTS[c];
    if (DIVISIONS[c]) return DIVISIONS[c];
  }
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const tok = cleaned[i];
    if (DISTRICTS[tok]) return DISTRICTS[tok];
    if (DIVISIONS[tok]) return DIVISIONS[tok];
  }
  return null;
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
var DIVISIONS, DISTRICTS;
var init_bdGeo = __esm({
  "src/utils/bdGeo.ts"() {
    "use strict";
    DIVISIONS = {
      "dhaka": { lat: 23.8103, lng: 90.4125 },
      "chittagong": { lat: 22.3569, lng: 91.7832 },
      "chattogram": { lat: 22.3569, lng: 91.7832 },
      // official spelling
      "rajshahi": { lat: 24.3745, lng: 88.6042 },
      "khulna": { lat: 22.8456, lng: 89.5403 },
      "barishal": { lat: 22.701, lng: 90.3535 },
      "barisal": { lat: 22.701, lng: 90.3535 },
      // common alternate
      "sylhet": { lat: 24.8949, lng: 91.8687 },
      "rangpur": { lat: 25.7439, lng: 89.2752 },
      "mymensingh": { lat: 24.7471, lng: 90.4203 }
    };
    DISTRICTS = {
      // ── Dhaka Division ────────────────────────────────────────────────────────
      "dhaka": { lat: 23.8103, lng: 90.4125 },
      "gazipur": { lat: 23.9999, lng: 90.4203 },
      "narayanganj": { lat: 23.6238, lng: 90.4999 },
      "narsingdi": { lat: 23.9225, lng: 90.7155 },
      "manikganj": { lat: 23.8639, lng: 89.9961 },
      "munshiganj": { lat: 23.5422, lng: 90.5303 },
      "tangail": { lat: 24.2513, lng: 89.9167 },
      "faridpur": { lat: 23.607, lng: 89.8429 },
      "gopalganj": { lat: 23.0055, lng: 89.8268 },
      "madaripur": { lat: 23.1641, lng: 90.1956 },
      "rajbari": { lat: 23.7577, lng: 89.6447 },
      "shariatpur": { lat: 23.2423, lng: 90.435 },
      "kishoreganj": { lat: 24.4447, lng: 90.7767 },
      // ── Mymensingh Division ───────────────────────────────────────────────────
      "mymensingh": { lat: 24.7471, lng: 90.4203 },
      "jamalpur": { lat: 24.9375, lng: 89.9377 },
      "sherpur": { lat: 25.019, lng: 90.0155 },
      "netrokona": { lat: 24.8703, lng: 90.7279 },
      // ── Chittagong Division ───────────────────────────────────────────────────
      "chittagong": { lat: 22.3569, lng: 91.7832 },
      "chattogram": { lat: 22.3569, lng: 91.7832 },
      "cox's bazar": { lat: 21.4272, lng: 92.0058 },
      "coxs bazar": { lat: 21.4272, lng: 92.0058 },
      "cox bazar": { lat: 21.4272, lng: 92.0058 },
      "feni": { lat: 23.0159, lng: 91.3976 },
      "noakhali": { lat: 22.8696, lng: 91.0994 },
      "lakshmipur": { lat: 22.9446, lng: 90.8282 },
      "laksmipur": { lat: 22.9446, lng: 90.8282 },
      "comilla": { lat: 23.4607, lng: 91.1809 },
      "cumilla": { lat: 23.4607, lng: 91.1809 },
      "chandpur": { lat: 23.2323, lng: 90.6517 },
      "brahmanbaria": { lat: 23.9603, lng: 91.1114 },
      "b. baria": { lat: 23.9603, lng: 91.1114 },
      "rangamati": { lat: 22.65, lng: 92.2002 },
      "khagrachhari": { lat: 23.1193, lng: 91.9847 },
      "bandarban": { lat: 22.1953, lng: 92.2184 },
      // ── Rajshahi Division ─────────────────────────────────────────────────────
      "rajshahi": { lat: 24.3745, lng: 88.6042 },
      "chapainawabganj": { lat: 24.5964, lng: 88.275 },
      "chapai nawabganj": { lat: 24.5964, lng: 88.275 },
      "natore": { lat: 24.4204, lng: 89.0001 },
      "sirajganj": { lat: 24.4534, lng: 89.7006 },
      "pabna": { lat: 24.0064, lng: 89.2372 },
      "naogaon": { lat: 24.7936, lng: 88.9312 },
      "joypurhat": { lat: 25.0978, lng: 89.0225 },
      "bogra": { lat: 24.851, lng: 89.3697 },
      "bogura": { lat: 24.851, lng: 89.3697 },
      // ── Khulna Division ───────────────────────────────────────────────────────
      "khulna": { lat: 22.8456, lng: 89.5403 },
      "jessore": { lat: 23.1634, lng: 89.2182 },
      "jashore": { lat: 23.1634, lng: 89.2182 },
      "satkhira": { lat: 22.7185, lng: 89.0705 },
      "narail": { lat: 23.1726, lng: 89.5123 },
      "magura": { lat: 23.4884, lng: 89.4196 },
      "jhenaidah": { lat: 23.5448, lng: 89.1508 },
      "jhenaidaha": { lat: 23.5448, lng: 89.1508 },
      "kushtia": { lat: 23.9012, lng: 89.1208 },
      "meherpur": { lat: 23.7614, lng: 88.6318 },
      "chuadanga": { lat: 23.6401, lng: 88.841 },
      "bagerhat": { lat: 22.6602, lng: 89.7854 },
      // ── Barishal Division ─────────────────────────────────────────────────────
      "barishal": { lat: 22.701, lng: 90.3535 },
      "barisal": { lat: 22.701, lng: 90.3535 },
      "bhola": { lat: 22.6857, lng: 90.6482 },
      "patuakhali": { lat: 22.3596, lng: 90.3298 },
      "pirojpur": { lat: 22.5791, lng: 89.9754 },
      "jhalakathi": { lat: 22.6404, lng: 90.1982 },
      "jhalokathi": { lat: 22.6404, lng: 90.1982 },
      "barguna": { lat: 22.0949, lng: 90.1116 },
      // ── Sylhet Division ───────────────────────────────────────────────────────
      "sylhet": { lat: 24.8949, lng: 91.8687 },
      "moulvibazar": { lat: 24.4829, lng: 91.7774 },
      "maulvibazar": { lat: 24.4829, lng: 91.7774 },
      "habiganj": { lat: 24.3746, lng: 91.4157 },
      "sunamganj": { lat: 25.0658, lng: 91.3991 },
      // ── Rangpur Division ──────────────────────────────────────────────────────
      "rangpur": { lat: 25.7439, lng: 89.2752 },
      "dinajpur": { lat: 25.6279, lng: 88.6338 },
      "thakurgaon": { lat: 26.0336, lng: 88.4616 },
      "panchagarh": { lat: 26.3411, lng: 88.5541 },
      "nilphamari": { lat: 25.9317, lng: 88.8561 },
      "lalmonirhat": { lat: 25.9923, lng: 89.2847 },
      "kurigram": { lat: 25.8072, lng: 89.6364 },
      "gaibandha": { lat: 25.3288, lng: 89.5285 }
    };
  }
});

// src/module/subOrder/subOrder.service.ts
import status from "http-status";
async function getNearestWarehouseToAddress(deliveryAddress) {
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });
  if (!warehouses.length) {
    throw new AppError_default(status.SERVICE_UNAVAILABLE, "No active warehouse available. Contact admin.");
  }
  if (warehouses.length === 1) return warehouses[0];
  const coords = extractCoordsFromBDAddress(deliveryAddress);
  if (!coords) {
    console.warn(`[warehouse-assign] Could not resolve coords for: "${deliveryAddress}" \u2014 assigning ${warehouses[0].name}`);
    return warehouses[0];
  }
  const nearest = warehouses.reduce((best, wh) => {
    const distBest = haversineKm(coords.lat, coords.lng, best.lat, best.lng);
    const distWh = haversineKm(coords.lat, coords.lng, wh.lat, wh.lng);
    return distWh < distBest ? wh : best;
  });
  const finalDist = haversineKm(coords.lat, coords.lng, nearest.lat, nearest.lng);
  console.info(`[warehouse-assign] "${deliveryAddress}" \u2192 ${nearest.name} (${nearest.city}) \u2014 ${finalDist.toFixed(1)} km`);
  return nearest;
}
async function ensureFulfillmentTask(orderId) {
  const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });
  if (existing) return existing;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { address: true }
  });
  const deliveryAddress = order?.address ?? "";
  const warehouse = await getNearestWarehouseToAddress(deliveryAddress);
  const task = await prisma.fulfillmentTask.create({
    data: { orderId, warehouseId: warehouse.id, status: "PENDING" }
  });
  await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["PLACED", "CONFIRMED"] } },
    data: { status: "PROCESSING" }
  });
  await prisma.orderTracking.create({
    data: {
      orderId,
      status: "CONFIRMED",
      note: `Order is being processed at ${warehouse.name} (${warehouse.city}). Packages are being consolidated.`
    }
  });
  return task;
}
var getSellerSubOrders, getOrderSubOrders, updateSubOrderStatus, subOrderService;
var init_subOrder_service = __esm({
  "src/module/subOrder/subOrder.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    init_bdGeo();
    getSellerSubOrders = async (sellerId) => {
      return prisma.subOrder.findMany({
        where: { sellerId },
        include: {
          order: {
            select: {
              id: true,
              address: true,
              createdAt: true,
              status: true,
              user: { select: { name: true, email: true } }
            }
          },
          items: {
            include: {
              medicine: { select: { id: true, name: true, price: true, image: true } }
            }
          },
          shipmentLeg: {
            select: {
              id: true,
              status: true,
              originWarehouse: { select: { id: true, name: true, city: true } },
              destWarehouse: { select: { id: true, name: true, city: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getOrderSubOrders = async (orderId, userId) => {
      const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
      if (!order) throw new AppError_default(status.NOT_FOUND, "Order not found");
      return prisma.subOrder.findMany({
        where: { orderId },
        include: {
          seller: { select: { name: true, email: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true, price: true, image: true } }
            }
          },
          shipmentLeg: {
            select: {
              id: true,
              status: true,
              arrivedAtOriginAt: true,
              dispatchedAt: true,
              arrivedAtDestAt: true,
              originWarehouse: { select: { id: true, name: true, city: true } },
              destWarehouse: { select: { id: true, name: true, city: true } }
            }
          }
        }
      });
    };
    updateSubOrderStatus = async (id, sellerId, orderStatus) => {
      const sub = await prisma.subOrder.findFirst({ where: { id, sellerId } });
      if (!sub) throw new AppError_default(status.NOT_FOUND, "Sub-order not found");
      const updated = await prisma.subOrder.update({
        where: { id },
        data: { status: orderStatus }
      });
      if (orderStatus === "SHIPPED") {
        await prisma.shipmentLeg.updateMany({
          where: { subOrderId: id, status: "SELLER_PREPARING" },
          data: { status: "AWAITING_ORIGIN_WH" }
        });
        await ensureFulfillmentTask(sub.orderId);
      }
      return updated;
    };
    subOrderService = {
      getSellerSubOrders,
      getOrderSubOrders,
      updateSubOrderStatus
    };
  }
});

// src/module/seller/seller.service.ts
import { ZodError } from "zod";
var postMedicineQuery, updateMedicineQuery, deleteMedicineQuery, getSellerOrderQuery, getSellerStats, updateOrderItemStatusQuery, getInventoryQuery, sellerService;
var init_seller_service = __esm({
  "src/module/seller/seller.service.ts"() {
    "use strict";
    init_prisma();
    init_seller_types();
    init_subOrder_service();
    postMedicineQuery = async (data, sellerId) => {
      try {
        const validatedData = postMedicineSchema.parse(data);
        const prismaData = {
          ...validatedData,
          sellerId,
          image: validatedData.image ?? null
          // Prisma expects string | null
        };
        const result = await prisma.medicine.create({
          data: {
            ...prismaData,
            discountPrice: validatedData.discountPrice ?? null
          }
        });
        return result;
      } catch (err) {
        if (err instanceof ZodError) {
          const messages = err.issues.map((issue) => issue.message).join(", ");
          throw new Error("Validation failed: " + messages);
        }
        throw err;
      }
    };
    updateMedicineQuery = async (id, data) => {
      try {
        const prismaData = {};
        if (data.name !== void 0) prismaData.name = { set: data.name };
        if (data.description !== void 0) prismaData.description = { set: data.description };
        if (data.price !== void 0) prismaData.price = { set: data.price };
        if (data.discountPrice !== void 0) prismaData.discountPrice = { set: data.discountPrice };
        if (data.stock !== void 0) prismaData.stock = { set: data.stock };
        if (data.manufacturer !== void 0) prismaData.manufacturer = { set: data.manufacturer };
        if (data.categoryId !== void 0) prismaData.categoryId = { set: data.categoryId };
        if (data.requiresPrescription !== void 0) prismaData.requiresPrescription = { set: data.requiresPrescription };
        if (data.image !== void 0) prismaData.image = { set: data.image };
        const result = await prisma.medicine.update({
          where: { id },
          data: prismaData
        });
        return result;
      } catch (err) {
        if (err instanceof ZodError) {
          const messages = err.issues.map((issue) => issue.message).join(", ");
          throw new Error("Validation failed: " + messages);
        }
        throw err;
      }
    };
    deleteMedicineQuery = async (id) => {
      const result = await prisma.medicine.delete({
        where: {
          id
        }
      });
      if (!result) {
        throw new Error("Medicine not found or could not be deleted");
        return;
      }
      return result;
    };
    getSellerOrderQuery = async (id) => {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          items: {
            select: {
              id: true,
              orderId: true,
              medicineId: true,
              quantity: true,
              price: true,
              status: true,
              subOrderId: true,
              medicine: { select: { sellerId: true, name: true, image: true } }
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
              },
              // Origin warehouse = where seller should physically ship their items
              originWarehouse: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  country: true,
                  phone: true,
                  manager: { select: { name: true, email: true } }
                }
              },
              // ShipmentLeg for real-time tracking status
              shipmentLeg: {
                select: {
                  id: true,
                  status: true,
                  arrivedAtOriginAt: true,
                  dispatchedAt: true,
                  arrivedAtDestAt: true,
                  destWarehouse: { select: { id: true, name: true, city: true } }
                }
              }
            }
          },
          // Include FulfillmentTask + Destination Warehouse (customer's end)
          fulfillmentTask: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  country: true,
                  phone: true,
                  manager: { select: { name: true, email: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      const filteredOrders = orders.flatMap((order) => {
        const items = order.items.filter((item) => item.medicine?.sellerId === id);
        if (!items.length) return [];
        return [{
          id: order.id,
          status: order.status,
          address: order.address,
          createdAt: order.createdAt,
          user: { name: order.user?.name ?? "\u2014", email: order.user?.email ?? "\u2014" },
          items,
          subOrders: order.subOrders ?? [],
          fulfillmentTask: order.fulfillmentTask ?? null
        }];
      });
      return filteredOrders;
    };
    getSellerStats = async (sellerId) => {
      const LOW_STOCK_THRESHOLD = 10;
      const [
        totalMedicines,
        outOfStockMedicines,
        lowStockMedicines,
        medicinePriceAgg
      ] = await Promise.all([
        prisma.medicine.count({ where: { sellerId } }),
        prisma.medicine.count({
          where: { sellerId, stock: 0 }
        }),
        prisma.medicine.count({
          where: {
            sellerId,
            stock: { gt: 0, lte: LOW_STOCK_THRESHOLD }
          }
        }),
        prisma.medicine.aggregate({
          where: { sellerId },
          _avg: { price: true }
        })
      ]);
      const orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              medicine: { sellerId }
            }
          }
        },
        include: {
          items: {
            select: {
              quantity: true,
              price: true,
              medicine: {
                select: { sellerId: true }
              }
            }
          }
        }
      });
      const totalOrders = orders.length;
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
      const ordersByStatus = await prisma.order.groupBy({
        by: ["status"],
        where: {
          items: {
            some: {
              medicine: { sellerId }
            }
          }
        },
        _count: true
      });
      const completedOrders = ordersByStatus.find((o) => o.status === "DELIVERED")?._count || 0;
      const cancelledOrders = ordersByStatus.find((o) => o.status === "CANCELLED")?._count || 0;
      const todayStart = /* @__PURE__ */ new Date();
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
              medicine: { sellerId }
            }
          }
        },
        include: {
          items: {
            select: {
              quantity: true,
              price: true,
              medicine: {
                select: { sellerId: true }
              }
            }
          }
        }
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
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        // Time-based
        todayRevenue,
        thisMonthRevenue
      };
    };
    updateOrderItemStatusQuery = async (orderId, orderItemsList, status53) => {
      await prisma.orderItem.updateMany({
        where: { id: { in: orderItemsList }, orderId },
        data: { status: status53 }
      });
      const remaining = await prisma.orderItem.count({
        where: { orderId, status: { not: status53 } }
      });
      if (remaining === 0) {
        await prisma.order.update({ where: { id: orderId }, data: { status: status53 } });
        if (status53 === "SHIPPED") {
          await ensureFulfillmentTask(orderId);
        }
      }
      return { success: true };
    };
    getInventoryQuery = async (sellerId) => {
      return await prisma.medicine.findMany({
        where: { sellerId },
        include: {
          batches: true,
          stockAlert: true,
          expiryAlerts: true
        },
        orderBy: { createdAt: "desc" }
      });
    };
    sellerService = {
      postMedicineQuery,
      updateMedicineQuery,
      deleteMedicineQuery,
      getSellerOrderQuery,
      getSellerStats,
      updateOrderItemStatusQuery,
      getInventoryQuery
    };
  }
});

// src/module/seller/seller.controller.ts
import { ZodError as ZodError2 } from "zod";
var postMedicine, updateMedicine, deleteMedicine, getSellerOrder, sellerStatController, updateOrderItemStatus, getInventory, sellerController;
var init_seller_controller = __esm({
  "src/module/seller/seller.controller.ts"() {
    "use strict";
    init_seller_service();
    init_prisma();
    postMedicine = async (req, res, next) => {
      try {
        const sellerId = req.user.id;
        const license = await prisma.sellerLicense.findUnique({ where: { sellerId } });
        if (!license || license.status !== "VERIFIED") {
          return res.status(403).json({
            success: false,
            message: "Your seller license must be approved (VERIFIED) by an admin before you can add medicines."
          });
        }
        const data = req.body;
        const result = await sellerService.postMedicineQuery(data, sellerId);
        res.status(201).json({
          message: "Medicine Added Successfully",
          data: result
        });
      } catch (error) {
        if (error instanceof ZodError2) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message
            }))
          });
        }
        console.error("Error from controller:", error);
        return res.status(500).json({
          message: "Internal server error",
          error: error.message || "Unknown error"
        });
      }
    };
    updateMedicine = async (req, res, next) => {
      const id = req.params.id;
      const data = req.body;
      try {
        const result = await sellerService.updateMedicineQuery(id, data);
        res.status(200).json({
          message: "Medicine updated successfully",
          data: result
        });
      } catch (error) {
        if (error instanceof ZodError2) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message
            }))
          });
        }
        console.error("Error in updateMedicine:", error);
        return res.status(500).json({
          message: "Internal server error",
          error: error.message || "Unknown error"
        });
      }
    };
    deleteMedicine = async (req, res, next) => {
      try {
        const id = req.params.id;
        const result = await sellerService.deleteMedicineQuery(id);
        res.status(200).json({
          message: "Medicine deleted successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          message: "Internal server error",
          error: error.message || "Unknown error"
        });
      }
    };
    getSellerOrder = async (req, res, next) => {
      const sellerId = req.user.id;
      try {
        const result = await sellerService.getSellerOrderQuery(sellerId);
        if (result.length === 0) {
          return res.status(404).json({
            status: false,
            message: "No order found"
          });
        }
        res.status(200).json({
          status: true,
          message: "Data fetched successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          message: "Internal server error",
          error: error.message || "Unknown error"
        });
      }
    };
    sellerStatController = async (req, res, next) => {
      try {
        const sellerId = req.user?.id;
        if (!sellerId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const stats = await sellerService.getSellerStats(sellerId);
        res.status(200).json({
          success: true,
          data: stats
        });
      } catch (error) {
        next(error);
      }
    };
    updateOrderItemStatus = async (req, res, next) => {
      try {
        const { orderId, orderItemIds, status: status53 } = req.body;
        if (!orderId || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "orderId and orderItemIds are required"
          });
        }
        if (!status53) {
          return res.status(400).json({
            success: false,
            message: "status is required"
          });
        }
        const result = await sellerService.updateOrderItemStatusQuery(
          orderId,
          orderItemIds,
          status53
        );
        return res.status(200).json({
          success: true,
          message: "Order item status updated successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    getInventory = async (req, res, next) => {
      try {
        const sellerId = req.user?.id;
        if (!sellerId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const inventory = await sellerService.getInventoryQuery(sellerId);
        res.status(200).json({
          success: true,
          message: "Inventory fetched successfully",
          data: inventory
        });
      } catch (error) {
        next(error);
      }
    };
    sellerController = {
      postMedicine,
      updateMedicine,
      deleteMedicine,
      getSellerOrder,
      sellerStatController,
      updateOrderItemStatus,
      getInventory
    };
  }
});

// src/middleware/auth.middleware.ts
var auth2, auth_middleware_default;
var init_auth_middleware = __esm({
  "src/middleware/auth.middleware.ts"() {
    "use strict";
    init_auth();
    auth2 = (allowedRoles) => {
      return async (req, res, next) => {
        try {
          const session = await auth.api.getSession({
            headers: req.headers
          });
          if (!session || !session.user) {
            return res.status(401).json({
              success: false,
              message: "Unauthorized. Please log in."
            });
          }
          if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
            return res.status(403).json({
              success: false,
              message: "Forbidden. Insufficient permissions."
            });
          }
          req.user = session.user;
          req.session = session.session;
          next();
        } catch (error) {
          console.error("Auth middleware unexpected error:", error);
          return res.status(500).json({
            success: false,
            message: "Internal server error while authenticating."
          });
        }
      };
    };
    auth_middleware_default = auth2;
  }
});

// src/module/seller/seller.route.ts
import { Router } from "express";
var router, sellerRouter;
var init_seller_route = __esm({
  "src/module/seller/seller.route.ts"() {
    "use strict";
    init_seller_controller();
    init_auth_middleware();
    router = Router();
    router.post("/medicines", auth_middleware_default(["SELLER"]), sellerController.postMedicine);
    router.put("/medicines/:id", auth_middleware_default(["SELLER"]), sellerController.updateMedicine);
    router.delete("/medicines/:id", auth_middleware_default(["SELLER"]), sellerController.deleteMedicine);
    router.get("/orders", auth_middleware_default(["SELLER"]), sellerController.getSellerOrder);
    router.get("/stat", auth_middleware_default(), sellerController.sellerStatController);
    router.put("/orders", auth_middleware_default(["SELLER"]), sellerController.updateOrderItemStatus);
    router.get("/inventory", auth_middleware_default(["SELLER"]), sellerController.getInventory);
    sellerRouter = router;
  }
});

// src/module/orders/order.types.ts
import { z as z3 } from "zod";
var createOrderSchema;
var init_order_types = __esm({
  "src/module/orders/order.types.ts"() {
    "use strict";
    createOrderSchema = z3.object({
      address: z3.string().min(5, "Address must be at least 5 characters"),
      items: z3.array(
        z3.object({
          medicineId: z3.string().min(1, "Medicine ID is required"),
          quantity: z3.number().int().positive("Quantity must be at least 1"),
          priceOverride: z3.number().positive().optional().nullable(),
          // flash-sale price per unit
          flashQuantity: z3.number().int().min(0).optional().default(0)
          // units at flash price
        })
      ).min(1, "At least one order item is required"),
      couponCode: z3.string().optional()
    });
  }
});

// src/module/orders/order.service.ts
async function nearestWarehouse(address) {
  const whs = await prisma.warehouse.findMany({ where: { isActive: true } });
  if (!whs.length) return null;
  if (whs.length === 1) return whs[0];
  let coords = null;
  const gpsMatch = address.match(/GPS\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
  if (gpsMatch) {
    coords = { lat: parseFloat(gpsMatch[1]), lng: parseFloat(gpsMatch[2]) };
  } else {
    coords = extractCoordsFromBDAddress(address);
  }
  if (!coords) return whs[0];
  return whs.reduce((best, wh) => {
    const distWh = wh.lat != null && wh.lng != null ? haversineKm(coords.lat, coords.lng, wh.lat, wh.lng) : Infinity;
    const distBest = best.lat != null && best.lng != null ? haversineKm(coords.lat, coords.lng, best.lat, best.lng) : Infinity;
    return distWh < distBest ? wh : best;
  });
}
var postOrderQuery, getUserOrdersQuery, getOrderDetailsQuery, deleteOrderByCustomer, getCustomerStats, orderService;
var init_order_service = __esm({
  "src/module/orders/order.service.ts"() {
    "use strict";
    init_prisma();
    init_bdGeo();
    postOrderQuery = async (userId, data) => {
      return await prisma.$transaction(async (tx) => {
        const medicineIds = data.items.map((i) => i.medicineId);
        const medicines = await tx.medicine.findMany({
          where: { id: { in: medicineIds } }
        });
        if (medicines.length !== medicineIds.length) {
          throw new Error("One or more medicines not found");
        }
        for (const item of data.items) {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (item.quantity > medicine.stock) {
            throw new Error(
              `Insufficient stock for "${medicine.name}". Available: ${medicine.stock}, Requested: ${item.quantity}`
            );
          }
        }
        const order = await tx.order.create({
          data: { userId, address: data.address }
        });
        await tx.orderTracking.create({
          data: {
            orderId: order.id,
            status: "PLACED",
            note: "Order placed successfully. Processing your items."
          }
        });
        const destWarehouse = await nearestWarehouse(data.address);
        const sellerItems = data.items.reduce((acc, item) => {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (!acc[medicine.sellerId]) acc[medicine.sellerId] = [];
          acc[medicine.sellerId].push({ ...item, medicine });
          return acc;
        }, {});
        for (const sellerId in sellerItems) {
          const itemRows = (sellerItems[sellerId] ?? []).map((item) => {
            const flashQty = item.flashQuantity ?? 0;
            const regularQty = item.quantity - flashQty;
            const flashPrice = flashQty > 0 && item.priceOverride != null ? item.priceOverride : item.medicine.price;
            const priceSnapshot = (flashQty * flashPrice + regularQty * item.medicine.price) / item.quantity;
            return { medicineId: item.medicineId, quantity: item.quantity, price: priceSnapshot };
          });
          const subTotal = itemRows.reduce((s, r) => s + r.price * r.quantity, 0);
          const seller = await tx.user.findUnique({
            where: { id: sellerId },
            select: { businessCity: true }
          });
          const originWarehouse = seller?.businessCity ? await nearestWarehouse(seller.businessCity) : destWarehouse;
          const subOrder = await tx.subOrder.create({
            data: {
              orderId: order.id,
              sellerId,
              total: subTotal,
              status: "PLACED",
              originWarehouseId: originWarehouse?.id ?? destWarehouse?.id ?? null
            }
          });
          await tx.orderItem.createMany({
            data: itemRows.map((r) => ({ ...r, orderId: order.id, subOrderId: subOrder.id }))
          });
          if (destWarehouse) {
            await tx.shipmentLeg.create({
              data: {
                orderId: order.id,
                subOrderId: subOrder.id,
                originWarehouseId: originWarehouse?.id ?? destWarehouse.id,
                destWarehouseId: destWarehouse.id,
                status: "SELLER_PREPARING"
              }
            });
          }
        }
        await Promise.all(
          data.items.map(
            (item) => tx.medicine.update({
              where: { id: item.medicineId },
              data: { stock: { decrement: item.quantity } }
            })
          )
        );
        const flashItems = data.items.filter(
          (item) => (item.flashQuantity ?? 0) > 0 && item.priceOverride != null
        );
        if (flashItems.length > 0) {
          const now = /* @__PURE__ */ new Date();
          await Promise.all(
            flashItems.map(async (item) => {
              const flashSale = await tx.flashSale.findFirst({
                where: {
                  medicineId: item.medicineId,
                  discountPrice: item.priceOverride,
                  isApproved: true,
                  startAt: { lte: now },
                  endAt: { gte: now }
                }
              });
              if (flashSale) {
                await tx.flashSale.update({
                  where: { id: flashSale.id },
                  data: { soldCount: { increment: item.flashQuantity } }
                });
              }
            })
          );
        }
        return order;
      });
    };
    getUserOrdersQuery = async (userId) => {
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
                  id: true,
                  status: true,
                  arrivedAtOriginAt: true,
                  dispatchedAt: true,
                  arrivedAtDestAt: true,
                  originWarehouse: { select: { id: true, name: true, city: true } },
                  destWarehouse: { select: { id: true, name: true, city: true } }
                }
              }
            }
          },
          fulfillmentTask: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              packedAt: true,
              dispatchedAt: true,
              warehouse: { select: { id: true, name: true, city: true } }
            }
          },
          tracking: { orderBy: { createdAt: "asc" } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getOrderDetailsQuery = async (orderId) => {
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
          tracking: { orderBy: { createdAt: "asc" } }
        }
      });
      if (!result) throw new Error("Order not found");
      return result;
    };
    deleteOrderByCustomer = async (orderId) => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found");
      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        throw new Error("Cannot delete delivered or cancelled orders");
      }
      await prisma.order.delete({ where: { id: orderId } });
      return { message: "Order deleted successfully" };
    };
    getCustomerStats = async (userId) => {
      const [orders, wishlistCount] = await Promise.all([
        prisma.order.findMany({
          where: { userId },
          include: { items: { select: { price: true, quantity: true } } }
        }),
        prisma.wishlist.count({ where: { userId } })
      ]);
      const totalOrders = orders.length;
      const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
      const activeCount = orders.filter(
        (o) => ["PLACED", "PROCESSING", "SHIPPED", "CONFIRMED"].includes(o.status)
      ).length;
      const totalSpent = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
        0
      );
      return { totalOrders, deliveredCount, activeCount, totalSpent, wishlistCount };
    };
    orderService = {
      postOrderQuery,
      getUserOrdersQuery,
      getOrderDetailsQuery,
      deleteOrderByCustomer,
      getCustomerStats
    };
  }
});

// src/module/orders/order.controller.ts
var createOrder, getUsersOrder, getOrderDetails, orderDeleteByCustomer, getCustomerStats2, orderController;
var init_order_controller = __esm({
  "src/module/orders/order.controller.ts"() {
    "use strict";
    init_order_types();
    init_order_service();
    createOrder = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const validatedData = createOrderSchema.parse(req.body);
        const result = await orderService.postOrderQuery(userId, validatedData);
        res.status(201).json({
          message: "Order placed successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    getUsersOrder = async (req, res, next) => {
      const userId = req.user.id;
      try {
        const result = await orderService.getUserOrdersQuery(userId);
        res.status(200).json({
          success: true,
          message: "User orders fetched successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    getOrderDetails = async (req, res, next) => {
      const orderId = req.params.id;
      try {
        const result = await orderService.getOrderDetailsQuery(orderId);
        res.status(200).json({
          success: true,
          message: "Order details fetched successfully",
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to fetch order details",
          error
        });
      }
    };
    orderDeleteByCustomer = async (req, res, next) => {
      const id = req.params.id;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Order ID is required" });
      }
      try {
        const result = await orderService.deleteOrderByCustomer(id);
        return res.status(200).json({ success: true, data: result });
      } catch (err) {
        return res.status(400).json({ success: false, message: err instanceof Error ? err.message : "Error deleting order" });
      }
    };
    getCustomerStats2 = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const stats = await orderService.getCustomerStats(userId);
        res.status(200).json({ success: true, message: "Customer stats fetched", data: stats });
      } catch (error) {
        next(error);
      }
    };
    orderController = {
      createOrder,
      getUsersOrder,
      getOrderDetails,
      orderDeleteByCustomer,
      getCustomerStats: getCustomerStats2
    };
  }
});

// src/module/orders/order.route.ts
import { Router as Router2 } from "express";
var router2, orderRouter;
var init_order_route = __esm({
  "src/module/orders/order.route.ts"() {
    "use strict";
    init_order_controller();
    init_auth_middleware();
    router2 = Router2();
    router2.post("/", auth_middleware_default(["CUSTOMER"]), orderController.createOrder);
    router2.get("/stats", auth_middleware_default(["CUSTOMER"]), orderController.getCustomerStats);
    router2.get("/", auth_middleware_default(["CUSTOMER", "ADMIN"]), orderController.getUsersOrder);
    router2.get("/my", auth_middleware_default(["CUSTOMER"]), orderController.getUsersOrder);
    router2.get("/:id", auth_middleware_default(["CUSTOMER", "ADMIN"]), orderController.getOrderDetails);
    router2.delete("/:id", auth_middleware_default(["CUSTOMER"]), orderController.orderDeleteByCustomer);
    orderRouter = router2;
  }
});

// src/module/admin/admin.service.ts
var getAllUsersQuery, getAllCategoryQuery, getUserDetailsQuery, updateUserQuery, updateCategoryQuery, getAdminStatsService, getAllOrder, banUserService, updateUserByAdmin, deleteCategoryQuery, createCategoryQuery, adminService;
var init_admin_service = __esm({
  "src/module/admin/admin.service.ts"() {
    "use strict";
    init_prisma();
    getAllUsersQuery = async () => {
      const result = await prisma.user.findMany({});
      return result;
    };
    getAllCategoryQuery = async () => {
      const result = await prisma.category.findMany({
        include: { _count: { select: { medicines: true } } },
        orderBy: { name: "asc" }
      });
      return result;
    };
    getUserDetailsQuery = async (userId) => {
      const result = await prisma.user.findUnique({
        where: {
          id: userId
        },
        include: {
          orders: true
        }
      });
      return result;
    };
    updateUserQuery = async (userId, updatedData) => {
      const isPresent = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      if (!isPresent) {
        throw new Error("User not found");
      }
      if (updatedData.image === void 0) {
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
      });
      return result;
    };
    updateCategoryQuery = async (categoryId, updatedData) => {
      const isPresent = await prisma.category.findUnique({
        where: {
          id: categoryId
        }
      });
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
      });
      return result;
    };
    getAdminStatsService = async () => {
      const totalUsers = await prisma.user.count();
      const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
      const totalSellers = await prisma.user.count({ where: { role: "SELLER" } });
      const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
      const totalMedicines = await prisma.medicine.count();
      const totalOrders = await prisma.order.count();
      const placedOrders = await prisma.order.count({ where: { status: "PLACED" } });
      const processingOrders = await prisma.order.count({ where: { status: "PROCESSING" } });
      const shippedOrders = await prisma.order.count({ where: { status: "SHIPPED" } });
      const deliveredOrders = await prisma.order.count({ where: { status: "DELIVERED" } });
      const cancelledOrders = await prisma.order.count({ where: { status: "CANCELLED" } });
      const totalCartItems = await prisma.cartItem.count();
      const totalCartQuantity = await prisma.cartItem.aggregate({
        _sum: { quantity: true }
      });
      const totalReviews = await prisma.review.count();
      const averageRating = await prisma.review.aggregate({
        _avg: { rating: true }
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
          cancelled: cancelledOrders
        },
        cart: { totalItems: totalCartItems, totalQuantity: totalCartQuantity._sum.quantity || 0 },
        reviews: { total: totalReviews, averageRating: averageRating._avg.rating || 0 }
      };
    };
    getAllOrder = async () => {
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
      });
      return result;
    };
    banUserService = async (userId, ban) => {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        throw new Error("User not found");
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: ban
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
          updatedAt: true
        }
      });
      return updatedUser;
    };
    updateUserByAdmin = async (userId, payload) => {
      const data = {};
      if (payload.name !== void 0) {
        data.name = payload.name;
      }
      if (payload.role !== void 0) {
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
          updatedAt: true
        }
      });
    };
    deleteCategoryQuery = async (id) => {
      return prisma.category.delete({
        where: { id }
      });
    };
    createCategoryQuery = async (name) => {
      return prisma.category.create({
        data: { name }
      });
    };
    adminService = {
      getAllUsersQuery,
      getAllCategoryQuery,
      updateUserQuery,
      updateCategoryQuery,
      getUserDetailsQuery,
      getAdminStatsService,
      getAllOrder,
      banUserService,
      updateUserByAdmin,
      createCategoryQuery,
      deleteCategoryQuery
    };
  }
});

// src/module/admin/admin.controller.ts
var getAllUsers, getUserDetails, getAllCategory, createCategory, deleteCategory, updateUser, updateCategory, getAdminStatsController, getAllOrder2, banUserController, adminUpdateUser, toggleCategoryFeatured, updateCategoryMeta, searchUsers, adminController;
var init_admin_controller = __esm({
  "src/module/admin/admin.controller.ts"() {
    "use strict";
    init_admin_service();
    getAllUsers = async (req, res, next) => {
      try {
        const result = await adminService.getAllUsersQuery();
        if (result.length === 0) {
          return res.status(404).json({
            status: false,
            message: "No users found"
          });
        }
        res.status(200).json({
          status: true,
          message: "Users fetched successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    getUserDetails = async (req, res, next) => {
      try {
        const userId = req.params.id;
        const result = await adminService.getUserDetailsQuery(userId);
        res.status(200).json({
          status: true,
          message: "User fetched successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    getAllCategory = async (req, res, next) => {
      try {
        const result = await adminService.getAllCategoryQuery();
        res.status(200).json({
          status: true,
          message: "Categories fetched successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    createCategory = async (req, res) => {
      try {
        const { name } = req.body;
        if (!name || !name.trim()) {
          return res.status(400).json({
            status: false,
            message: "Category name is required"
          });
        }
        const result = await adminService.createCategoryQuery(name);
        res.status(201).json({
          status: true,
          message: "Category created successfully",
          data: result
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    deleteCategory = async (req, res) => {
      try {
        const { id } = req.params;
        await adminService.deleteCategoryQuery(id);
        res.status(200).json({
          status: true,
          message: "Category deleted successfully"
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    updateUser = async (req, res, next) => {
      try {
        const userId = req.params.id;
        const updatedData = req.body;
        const result = await adminService.updateUserQuery(userId, updatedData);
        res.status(200).json({
          status: true,
          message: "User updated successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    updateCategory = async (req, res, next) => {
      try {
        const categoryId = req.params.id;
        const updatedData = req.body;
        const result = await adminService.updateCategoryQuery(categoryId, updatedData);
        res.status(200).json({
          status: true,
          message: "Category updated successfully",
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          status: false,
          message: "Internal server error",
          error
        });
      }
    };
    getAdminStatsController = async (req, res, next) => {
      try {
        const stats = await adminService.getAdminStatsService();
        res.status(200).json({
          success: true,
          message: "Admin stats fetched successfully",
          data: stats
        });
      } catch (err) {
        next(err);
      }
    };
    getAllOrder2 = async (req, res, next) => {
      try {
        const order = await adminService.getAllOrder();
        res.status(200).json({
          success: true,
          message: "Order fetched successfully",
          data: order
        });
      } catch (err) {
        next(err);
      }
    };
    banUserController = async (req, res, next) => {
      try {
        if (!req.user || req.user.role !== "ADMIN") {
          return res.status(403).json({ message: "Forbidden" });
        }
        const { userId } = req.params;
        const { ban } = req.body;
        if (typeof ban !== "boolean") {
          return res.status(400).json({ message: "Ban must be boolean" });
        }
        const user = await adminService.banUserService(userId, ban);
        res.status(200).json({
          success: true,
          message: ban ? "User banned successfully" : "User unbanned successfully",
          data: user
        });
      } catch (error) {
        next(error);
      }
    };
    adminUpdateUser = async (req, res) => {
      try {
        const userId = req.params.id;
        const { name, role } = req.body;
        if (!name && !role) {
          return res.status(400).json({
            status: false,
            message: "Nothing to update"
          });
        }
        const user = await adminService.updateUserByAdmin(userId, { name, role });
        return res.status(200).json({
          status: true,
          message: "User updated successfully",
          data: user
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          status: false,
          message: error.message || "Failed to update user"
        });
      }
    };
    toggleCategoryFeatured = async (req, res) => {
      try {
        const { id } = req.params;
        const cat = await (await import("./prisma-OAS4LPRP.mjs")).prisma.category.findUnique({ where: { id } });
        if (!cat) return res.status(404).json({ status: false, message: "Category not found" });
        const updated = await (await import("./prisma-OAS4LPRP.mjs")).prisma.category.update({
          where: { id },
          data: { isFeatured: !cat.isFeatured }
        });
        return res.status(200).json({ status: true, message: `Category ${updated.isFeatured ? "featured" : "unfeatured"}`, data: updated });
      } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error });
      }
    };
    updateCategoryMeta = async (req, res) => {
      try {
        const { id } = req.params;
        const { icon, color, name } = req.body;
        const updated = await (await import("./prisma-OAS4LPRP.mjs")).prisma.category.update({
          where: { id },
          data: { ...icon ? { icon } : {}, ...color ? { color } : {}, ...name ? { name } : {} }
        });
        return res.status(200).json({ status: true, message: "Category updated", data: updated });
      } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error });
      }
    };
    searchUsers = async (req, res) => {
      try {
        const email = (req.query.email || "").trim();
        if (!email || email.length < 2) {
          return res.status(200).json({ status: true, data: [] });
        }
        const { prisma: prisma2 } = await import("./prisma-OAS4LPRP.mjs");
        const users = await prisma2.user.findMany({
          where: { email: { contains: email, mode: "insensitive" } },
          select: { id: true, name: true, email: true, image: true, role: true },
          take: 8,
          orderBy: { email: "asc" }
        });
        return res.status(200).json({ status: true, data: users });
      } catch (error) {
        return res.status(500).json({ status: false, message: "Search failed", error });
      }
    };
    adminController = {
      getAllUsers,
      getAllCategory,
      updateUser,
      updateCategory,
      getUserDetails,
      getAdminStatsController,
      getAllOrder: getAllOrder2,
      banUserController,
      adminUpdateUser,
      createCategory,
      deleteCategory,
      toggleCategoryFeatured,
      updateCategoryMeta,
      searchUsers
    };
  }
});

// src/module/admin/admin.route.ts
import { Router as Router3 } from "express";
var router3, adminRouter;
var init_admin_route = __esm({
  "src/module/admin/admin.route.ts"() {
    "use strict";
    init_admin_controller();
    init_auth_middleware();
    router3 = Router3();
    router3.get("/users", auth_middleware_default(["ADMIN"]), adminController.getAllUsers);
    router3.get("/users/search", auth_middleware_default(["ADMIN"]), adminController.searchUsers);
    router3.get("/users/:id", adminController.getUserDetails);
    router3.get("/categories", adminController.getAllCategory);
    router3.post("/categories", auth_middleware_default(["ADMIN"]), adminController.createCategory);
    router3.delete("/categories/:id", auth_middleware_default(["ADMIN"]), adminController.deleteCategory);
    router3.put("/categories/:id", auth_middleware_default(["ADMIN"]), adminController.updateCategory);
    router3.put("/users/:id", adminController.updateUser);
    router3.get("/stats", auth_middleware_default(["ADMIN"]), adminController.getAdminStatsController);
    router3.get("/order", auth_middleware_default(["ADMIN"]), adminController.getAllOrder);
    router3.patch(
      "/users/:userId/ban",
      auth_middleware_default(["ADMIN"]),
      adminController.banUserController
    );
    router3.patch("/users/:id", auth_middleware_default(["ADMIN"]), adminController.adminUpdateUser);
    router3.patch("/categories/:id/featured", auth_middleware_default(["ADMIN"]), adminController.toggleCategoryFeatured);
    router3.patch("/categories/:id/meta", auth_middleware_default(["ADMIN"]), adminController.updateCategoryMeta);
    adminRouter = router3;
  }
});

// src/module/auth/auth.controller.ts
var registerController, loginController, meController, updateProfileController, authController;
var init_auth_controller = __esm({
  "src/module/auth/auth.controller.ts"() {
    "use strict";
    init_auth();
    init_prisma();
    registerController = async (req, res, next) => {
      try {
        const { email, password, name, role, image } = req.body;
        const safeRole = role === "ADMIN" ? "CUSTOMER" : role || "CUSTOMER";
        const { headers, response } = await auth.api.signUpEmail({
          returnHeaders: true,
          body: { email, password, name, role: safeRole, image: image || void 0 }
        });
        const setCookie = headers.get("set-cookie");
        if (setCookie) {
          res.setHeader("Set-Cookie", setCookie);
        }
        res.status(201).json({
          message: "Registration successful",
          data: response
        });
      } catch (error) {
        next(error);
      }
    };
    loginController = async (req, res, next) => {
      try {
        const { email, password } = req.body;
        const { headers, response } = await auth.api.signInEmail({
          returnHeaders: true,
          body: { email, password }
        });
        const cookies = headers.getSetCookie?.() ?? headers.get("set-cookie");
        if (cookies) {
          res.setHeader("Set-Cookie", cookies);
        }
        res.status(200).json({
          message: "Login successful",
          user: response.user
        });
      } catch (error) {
        next(error);
      }
    };
    meController = async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true
          }
        });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
      } catch (error) {
        next(error);
      }
    };
    updateProfileController = async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { name, email, image } = req.body;
        if (!name || !email) {
          return res.status(400).json({ message: "Name and email are required" });
        }
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email is already in use" });
        }
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            name,
            email,
            image: image || null
            // allow clearing the image
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });
        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          user: updatedUser
        });
      } catch (error) {
        next(error);
      }
    };
    authController = {
      registerController,
      loginController,
      meController,
      updateProfileController
    };
  }
});

// src/module/auth/auth.route.ts
import { Router as Router4 } from "express";
var router4, authRouter;
var init_auth_route = __esm({
  "src/module/auth/auth.route.ts"() {
    "use strict";
    init_auth_controller();
    init_auth_middleware();
    router4 = Router4();
    router4.post("/register", authController.registerController);
    router4.post("/login", authController.loginController);
    router4.get("/me", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN", "WAREHOUSE"]), authController.meController);
    router4.patch("/update", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN", "WAREHOUSE"]), authController.updateProfileController);
    authRouter = router4;
  }
});

// src/module/medicine/medicine.service.ts
var getAllMedicines, getMyMedicines, getMedicineById, medicineService;
var init_medicine_service = __esm({
  "src/module/medicine/medicine.service.ts"() {
    "use strict";
    init_prisma();
    getAllMedicines = async (filters) => {
      const { categoryId, sellerId, name, minPrice, maxPrice } = filters;
      const where = {};
      if (categoryId) where.categoryId = categoryId;
      if (sellerId) where.sellerId = sellerId;
      if (name) where.name = { contains: String(name), mode: "insensitive" };
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }
      const medicines = await prisma.medicine.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      return medicines;
    };
    getMyMedicines = async (sellerId) => {
      const medicines = await prisma.medicine.findMany({
        where: {
          sellerId
        },
        include: {
          category: {
            select: {
              name: true
            }
          },
          seller: {
            select: {
              name: true
            }
          }
        }
      });
      return medicines;
    };
    getMedicineById = async (id) => {
      const medicine = await prisma.medicine.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      if (!medicine) {
        throw new Error("Medicine not found");
      }
      return medicine;
    };
    medicineService = {
      getAllMedicines,
      getMedicineById,
      getMyMedicines
    };
  }
});

// src/module/medicine/medicine.controller.ts
var getAllMedicines2, getMyMedicines2, getMedicineById2, medicineController;
var init_medicine_controller = __esm({
  "src/module/medicine/medicine.controller.ts"() {
    "use strict";
    init_medicine_service();
    getAllMedicines2 = async (req, res, next) => {
      try {
        const medicines = await medicineService.getAllMedicines(req.query);
        res.status(200).json({
          success: true,
          count: medicines.length,
          data: medicines
        });
      } catch (error) {
        next(error);
      }
    };
    getMyMedicines2 = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const medicines = await medicineService.getMyMedicines(userId);
        res.status(200).json({
          success: true,
          count: medicines.length,
          data: medicines
        });
      } catch (error) {
        next(error);
      }
    };
    getMedicineById2 = async (req, res, next) => {
      try {
        const { id } = req.params;
        const medicine = await medicineService.getMedicineById(id);
        res.status(200).json({
          success: true,
          data: medicine
        });
      } catch (error) {
        next(error);
      }
    };
    medicineController = {
      getAllMedicines: getAllMedicines2,
      getMedicineById: getMedicineById2,
      getMyMedicines: getMyMedicines2
    };
  }
});

// src/utils/catchAsync.ts
var catchAsync;
var init_catchAsync = __esm({
  "src/utils/catchAsync.ts"() {
    "use strict";
    catchAsync = (fn) => {
      return async (req, res, next) => {
        try {
          await fn(req, res, next);
        } catch (error) {
          next(error);
        }
      };
    };
  }
});

// src/utils/sendResponse.ts
var sendResponse;
var init_sendResponse = __esm({
  "src/utils/sendResponse.ts"() {
    "use strict";
    sendResponse = (res, responseData) => {
      res.status(responseData.status).json({
        success: responseData.success,
        message: responseData.message,
        data: responseData.data,
        meta: responseData.meta
      });
    };
  }
});

// src/module/medicine/medicine.router.ts
import { Router as Router5 } from "express";
import status2 from "http-status";
var router5, medicineRouter;
var init_medicine_router = __esm({
  "src/module/medicine/medicine.router.ts"() {
    "use strict";
    init_medicine_controller();
    init_auth_middleware();
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    router5 = Router5();
    router5.get("/", medicineController.getAllMedicines);
    router5.get("/own", auth_middleware_default(["SELLER"]), medicineController.getMyMedicines);
    router5.get("/featured", catchAsync(async (req, res) => {
      const medicines = await prisma.medicine.findMany({
        where: { isFeatured: true, stock: { gt: 0 } },
        include: {
          category: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
          reviews: { select: { rating: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      });
      sendResponse(res, { status: status2.OK, success: true, message: "Featured medicines", data: medicines });
    }));
    router5.patch("/:id/feature", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { isFeatured } = req.body;
      const med = await prisma.medicine.update({
        where: { id: req.params.id },
        data: { isFeatured: Boolean(isFeatured) },
        include: {
          seller: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } }
        }
      });
      sendResponse(res, { status: status2.OK, success: true, message: `Medicine ${isFeatured ? "featured" : "unfeatured"}`, data: med });
    }));
    router5.patch("/categories/:id/featured", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const cat = await prisma.category.findUnique({ where: { id: req.params.id } });
      if (!cat) return sendResponse(res, { status: status2.NOT_FOUND, success: false, message: "Category not found", data: null });
      const updated = await prisma.category.update({
        where: { id: req.params.id },
        data: { isFeatured: !cat.isFeatured }
      });
      sendResponse(res, { status: status2.OK, success: true, message: `Category ${updated.isFeatured ? "featured" : "unfeatured"}`, data: updated });
    }));
    router5.get("/:id", medicineController.getMedicineById);
    medicineRouter = router5;
  }
});

// src/module/cart/cart.service.ts
import status3 from "http-status";
var findActiveFlashSale, addToCartService, getMedicineCartStatus, getFromCartService, updateCartItemService, removeCartItemService, clearCartService, cartService;
var init_cart_service = __esm({
  "src/module/cart/cart.service.ts"() {
    "use strict";
    init_AppError();
    init_prisma();
    findActiveFlashSale = async (medicineId) => {
      const now = /* @__PURE__ */ new Date();
      return prisma.flashSale.findFirst({
        where: {
          medicineId,
          isApproved: true,
          startAt: { lte: now },
          endAt: { gte: now }
        },
        orderBy: { endAt: "asc" }
      });
    };
    addToCartService = async (userId, medicineId, quantity = 1, priceOverride) => {
      const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
      if (!medicine) throw new AppError_default(status3.NOT_FOUND, "Medicine not found");
      let cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) cart = await prisma.cart.create({ data: { userId } });
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_medicineId: { cartId: cart.id, medicineId } }
      });
      const currentQtyInCart = existing?.quantity ?? 0;
      const totalQtyAfterAdd = currentQtyInCart + quantity;
      if (totalQtyAfterAdd > medicine.stock) {
        throw new AppError_default(
          status3.BAD_REQUEST,
          `Only ${medicine.stock} unit(s) available in stock (you already have ${currentQtyInCart} in cart).`
        );
      }
      let newFlashQtyForThisAdd = 0;
      let resolvedPriceOverride = null;
      if (priceOverride != null) {
        const flashSale = await findActiveFlashSale(medicineId);
        if (flashSale) {
          const alreadyFlashInCart = existing?.flashQuantity ?? 0;
          const globalAvailable = flashSale.saleStock - flashSale.soldCount;
          const additionalFlash = Math.max(0, globalAvailable - alreadyFlashInCart);
          newFlashQtyForThisAdd = Math.min(quantity, additionalFlash);
          resolvedPriceOverride = newFlashQtyForThisAdd > 0 ? flashSale.discountPrice : null;
        }
      }
      let cartItem;
      if (existing) {
        const newTotalFlash = (existing.flashQuantity ?? 0) + newFlashQtyForThisAdd;
        cartItem = await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: totalQtyAfterAdd,
            flashQuantity: newTotalFlash,
            // Only lock in priceOverride if we actually have flash units
            ...resolvedPriceOverride != null ? { priceOverride: resolvedPriceOverride } : {}
          }
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            medicineId,
            quantity,
            priceOverride: resolvedPriceOverride,
            flashQuantity: newFlashQtyForThisAdd
          }
        });
      }
      return cartItem;
    };
    getMedicineCartStatus = async (userId, medicineId) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
      });
      if (!cart) return { inCart: false, quantity: 0 };
      const cartItem = cart.items.find((item) => item.medicineId === medicineId);
      if (!cartItem) return { inCart: false, quantity: 0 };
      return { inCart: true, quantity: cartItem.quantity };
    };
    getFromCartService = async (userId) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { medicine: true }
          }
        }
      });
      if (!cart) return { items: [], totalQuantity: 0, totalPrice: 0 };
      const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cart.items.reduce((sum, item) => {
        const flashQty = item.flashQuantity ?? 0;
        const regularQty = item.quantity - flashQty;
        const flashPrice = item.priceOverride ?? item.medicine.price;
        return sum + flashQty * flashPrice + regularQty * item.medicine.price;
      }, 0);
      return { items: cart.items, totalQuantity, totalPrice };
    };
    updateCartItemService = async (userId, itemId, quantity) => {
      if (quantity < 1) throw new AppError_default(status3.BAD_REQUEST, "Quantity must be at least 1");
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { medicine: true }
      });
      if (!cartItem) throw new AppError_default(status3.NOT_FOUND, "Cart item not found");
      if (quantity > cartItem.medicine.stock) {
        throw new AppError_default(
          status3.BAD_REQUEST,
          `Only ${cartItem.medicine.stock} unit(s) available in stock`
        );
      }
      let newFlashQty = 0;
      if (cartItem.priceOverride != null) {
        const flashSale = await findActiveFlashSale(cartItem.medicineId);
        if (flashSale) {
          const flashSlotsAvailable = flashSale.saleStock - flashSale.soldCount;
          newFlashQty = Math.min(quantity, Math.max(0, flashSlotsAvailable));
        }
      }
      const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          flashQuantity: newFlashQty
        },
        include: { medicine: true }
      });
      return updated;
    };
    removeCartItemService = async (userId, itemId) => {
      const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
      if (!cartItem) throw new AppError_default(status3.NOT_FOUND, "Cart item not found");
      const cart = await prisma.cart.findUnique({ where: { id: cartItem.cartId } });
      if (!cart || cart.userId !== userId) throw new AppError_default(status3.UNAUTHORIZED, "Unauthorized");
      await prisma.cartItem.delete({ where: { id: itemId } });
      return { success: true, message: "Cart item removed successfully" };
    };
    clearCartService = async (userId) => {
      const cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) return { success: true };
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      return { success: true, message: "Cart cleared" };
    };
    cartService = {
      addToCartService,
      getMedicineCartStatus,
      getFromCartService,
      updateCartItemService,
      removeCartItemService,
      clearCartService
    };
  }
});

// src/module/cart/cart.controller.ts
var addToCartController, getMedicineCartStatusController, getFromCartController, updateCartItemController, removeCartItemController, clearCartController, cartController;
var init_cart_controller = __esm({
  "src/module/cart/cart.controller.ts"() {
    "use strict";
    init_cart_service();
    addToCartController = async (req, res, next) => {
      try {
        const { medicineId, quantity, priceOverride } = req.body;
        if (!medicineId) {
          return res.status(400).json({
            success: false,
            message: "medicineId is required"
          });
        }
        const userId = req.user.id;
        const cartItem = await cartService.addToCartService(
          userId,
          medicineId,
          quantity || 1,
          priceOverride ?? null
          // ← flash-sale price or null
        );
        return res.status(200).json({
          success: true,
          message: "Item added to cart",
          data: cartItem
        });
      } catch (error) {
        next(error);
      }
    };
    getMedicineCartStatusController = async (req, res, next) => {
      try {
        const userId = req.user?.id;
        const medicineId = req.params.medicineId;
        if (!userId || !medicineId) {
          return res.status(400).json({
            success: false,
            message: "User ID and Medicine ID are required"
          });
        }
        const status53 = await cartService.getMedicineCartStatus(userId, medicineId);
        return res.status(200).json({
          success: true,
          data: status53
        });
      } catch (err) {
        next(err);
      }
    };
    getFromCartController = async (req, res, next) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized"
          });
        }
        const cart = await cartService.getFromCartService(userId);
        return res.status(200).json({
          success: true,
          message: "Cart fetched successfully",
          data: cart
        });
      } catch (error) {
        next(error);
      }
    };
    updateCartItemController = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { itemId, quantity } = req.body;
        if (!itemId || quantity === void 0) {
          return res.status(400).json({ success: false, message: "itemId and quantity are required" });
        }
        const updatedItem = await cartService.updateCartItemService(userId, itemId, quantity);
        return res.status(200).json({
          success: true,
          message: "Cart item updated successfully",
          data: updatedItem
        });
      } catch (error) {
        next(error);
      }
    };
    removeCartItemController = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { itemId } = req.body;
        if (!itemId) {
          return res.status(400).json({ success: false, message: "itemId is required" });
        }
        const result = await cartService.removeCartItemService(userId, itemId);
        return res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    };
    clearCartController = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const result = await cartService.clearCartService(userId);
        return res.status(200).json({ success: true, message: "Cart cleared", data: result });
      } catch (error) {
        next(error);
      }
    };
    cartController = {
      addToCartController,
      getMedicineCartStatusController,
      getFromCartController,
      updateCartItemController,
      removeCartItemController,
      clearCartController
    };
  }
});

// src/module/cart/cart.router.ts
import { Router as Router6 } from "express";
var router6, cartRouter;
var init_cart_router = __esm({
  "src/module/cart/cart.router.ts"() {
    "use strict";
    init_auth_middleware();
    init_cart_controller();
    router6 = Router6();
    router6.get("/", auth_middleware_default(["CUSTOMER"]), cartController.getFromCartController);
    router6.post("/add", auth_middleware_default(), cartController.addToCartController);
    router6.get("/status/:medicineId", auth_middleware_default(), cartController.getMedicineCartStatusController);
    router6.patch("/update", auth_middleware_default(["CUSTOMER"]), cartController.updateCartItemController);
    router6.delete("/remove", auth_middleware_default(["CUSTOMER"]), cartController.removeCartItemController);
    router6.delete("/clear", auth_middleware_default(["CUSTOMER"]), cartController.clearCartController);
    cartRouter = router6;
  }
});

// src/module/prescription/prescription.service.ts
var uploadPrescription, getMyPrescriptions, getAllPrescriptions, reviewPrescription, prescriptionService;
var init_prescription_service = __esm({
  "src/module/prescription/prescription.service.ts"() {
    "use strict";
    init_prisma();
    uploadPrescription = async (userId, imageUrl, notes) => {
      return prisma.prescription.create({
        data: {
          userId,
          imageUrl,
          ...notes !== void 0 ? { notes } : {}
        }
      });
    };
    getMyPrescriptions = async (userId) => {
      return prisma.prescription.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });
    };
    getAllPrescriptions = async (status53) => {
      return prisma.prescription.findMany({
        where: status53 !== void 0 ? { status: status53 } : {},
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    reviewPrescription = async (id, status53, adminNote) => {
      return prisma.prescription.update({
        where: { id },
        data: {
          status: status53,
          ...adminNote !== void 0 ? { adminNote } : {}
        }
      });
    };
    prescriptionService = {
      uploadPrescription,
      getMyPrescriptions,
      getAllPrescriptions,
      reviewPrescription
    };
  }
});

// src/module/prescription/prescription.controller.ts
import status4 from "http-status";
var uploadPrescription2, getMyPrescriptions2, getAllPrescriptions2, reviewPrescription2, prescriptionController;
var init_prescription_controller = __esm({
  "src/module/prescription/prescription.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_prescription_service();
    uploadPrescription2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const { imageUrl, notes } = req.body;
      if (!imageUrl) throw new AppError_default(status4.BAD_REQUEST, "imageUrl is required");
      const data = await prescriptionService.uploadPrescription(userId, imageUrl, notes);
      sendResponse(res, {
        status: status4.CREATED,
        success: true,
        message: "Prescription uploaded successfully",
        data
      });
    });
    getMyPrescriptions2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const data = await prescriptionService.getMyPrescriptions(userId);
      sendResponse(res, {
        status: status4.OK,
        success: true,
        message: "Prescriptions fetched successfully",
        data
      });
    });
    getAllPrescriptions2 = catchAsync(async (req, res) => {
      const statusFilter = req.query.status;
      const data = await prescriptionService.getAllPrescriptions(statusFilter);
      sendResponse(res, {
        status: status4.OK,
        success: true,
        message: "All prescriptions fetched",
        data
      });
    });
    reviewPrescription2 = catchAsync(async (req, res) => {
      const id = String(req.params.id);
      const { status: newStatus, adminNote } = req.body;
      if (!newStatus) throw new AppError_default(status4.BAD_REQUEST, "status is required");
      const data = await prescriptionService.reviewPrescription(
        id,
        newStatus,
        adminNote
      );
      sendResponse(res, { status: status4.OK, success: true, message: "Prescription reviewed", data });
    });
    prescriptionController = {
      uploadPrescription: uploadPrescription2,
      getMyPrescriptions: getMyPrescriptions2,
      getAllPrescriptions: getAllPrescriptions2,
      reviewPrescription: reviewPrescription2
    };
  }
});

// src/module/prescription/prescription.route.ts
import { Router as Router7 } from "express";
var router7, prescriptionRouter;
var init_prescription_route = __esm({
  "src/module/prescription/prescription.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_prescription_controller();
    router7 = Router7();
    router7.post("/", auth_middleware_default(["CUSTOMER"]), prescriptionController.uploadPrescription);
    router7.get("/my", auth_middleware_default(["CUSTOMER"]), prescriptionController.getMyPrescriptions);
    router7.get("/", auth_middleware_default(["ADMIN"]), prescriptionController.getAllPrescriptions);
    router7.patch("/:id/review", auth_middleware_default(["ADMIN"]), prescriptionController.reviewPrescription);
    prescriptionRouter = router7;
  }
});

// src/module/wallet/wallet.service.ts
var getOrCreateWallet, getWalletWithTransactions, creditWallet, debitWallet, getAllWallets, getSellerWallet, requestWithdrawal, getSellerWithdrawals, getAllWithdrawals, processWithdrawal, walletService;
var init_wallet_service = __esm({
  "src/module/wallet/wallet.service.ts"() {
    "use strict";
    init_enums();
    init_prisma();
    getOrCreateWallet = async (userId) => {
      let wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await prisma.wallet.create({ data: { userId } });
      }
      return wallet;
    };
    getWalletWithTransactions = async (userId) => {
      const wallet = await getOrCreateWallet(userId);
      const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 50
      });
      return { ...wallet, transactions };
    };
    creditWallet = async (userId, amount, description) => {
      const wallet = await getOrCreateWallet(userId);
      const [updatedWallet, txn] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } }
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: TransactionType.DEPOSIT,
            ...description !== void 0 ? { description } : {}
          }
        })
      ]);
      return { wallet: updatedWallet, transaction: txn };
    };
    debitWallet = async (userId, amount, description) => {
      const wallet = await getOrCreateWallet(userId);
      if (wallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }
      const [updatedWallet, txn] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } }
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: TransactionType.PURCHASE,
            ...description !== void 0 ? { description } : {}
          }
        })
      ]);
      return { wallet: updatedWallet, transaction: txn };
    };
    getAllWallets = async () => {
      return prisma.wallet.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { balance: "desc" }
      });
    };
    getSellerWallet = async (sellerId) => {
      const wallet = await getOrCreateWallet(sellerId);
      const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
        where: { sellerId, status: "PENDING" }
      });
      const pendingAmount = pendingWithdrawals.reduce((s, w) => s + w.amount, 0);
      const totalEarned = transactions.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0);
      const totalWithdrawn = transactions.filter((t) => t.type === "WITHDRAWAL").reduce((s, t) => s + t.amount, 0);
      return { ...wallet, transactions, pendingAmount, totalEarned, totalWithdrawn };
    };
    requestWithdrawal = async (sellerId, amount, bankName, accountNumber, branchName) => {
      const wallet = await getOrCreateWallet(sellerId);
      if (wallet.balance < amount) throw new Error("Insufficient wallet balance for this withdrawal");
      if (amount < 10) throw new Error("Minimum withdrawal amount is $10");
      return prisma.withdrawalRequest.create({
        data: { sellerId, amount, bankName, accountNumber, branchName }
      });
    };
    getSellerWithdrawals = async (sellerId) => {
      return prisma.withdrawalRequest.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" }
      });
    };
    getAllWithdrawals = async (statusFilter) => {
      return prisma.withdrawalRequest.findMany({
        where: statusFilter ? { status: statusFilter } : void 0,
        include: {
          seller: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    processWithdrawal = async (id, action, adminNote) => {
      const request = await prisma.withdrawalRequest.findUnique({ where: { id } });
      if (!request) throw new Error("Withdrawal request not found");
      if (request.status !== "PENDING") throw new Error("Request is already processed");
      if (action === "APPROVED") {
        const wallet = await getOrCreateWallet(request.sellerId);
        if (wallet.balance < request.amount) throw new Error("Seller has insufficient balance");
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: request.amount } }
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: request.amount,
              type: TransactionType.WITHDRAWAL,
              description: `Withdrawal approved \u2014 ref #${id.slice(-6).toUpperCase()}`
            }
          }),
          prisma.withdrawalRequest.update({
            where: { id },
            data: { status: "APPROVED", adminNote: adminNote || null, processedAt: /* @__PURE__ */ new Date() }
          })
        ]);
      } else {
        await prisma.withdrawalRequest.update({
          where: { id },
          data: { status: "REJECTED", adminNote: adminNote || null, processedAt: /* @__PURE__ */ new Date() }
        });
      }
      return prisma.withdrawalRequest.findUnique({ where: { id } });
    };
    walletService = {
      getWalletWithTransactions,
      creditWallet,
      debitWallet,
      getAllWallets,
      getOrCreateWallet,
      getSellerWallet,
      requestWithdrawal,
      getSellerWithdrawals,
      getAllWithdrawals,
      processWithdrawal
    };
  }
});

// src/module/wallet/wallet.controller.ts
import status5 from "http-status";
var getMyWallet, topUpWallet, getAllWallets2, adminCreditWallet, getSellerWallet2, getWithdrawals, requestWithdrawal2, getAllWithdrawals2, processWithdrawal2, walletController;
var init_wallet_controller = __esm({
  "src/module/wallet/wallet.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_wallet_service();
    getMyWallet = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const data = await walletService.getWalletWithTransactions(userId);
      sendResponse(res, { status: status5.OK, success: true, message: "Wallet fetched successfully", data });
    });
    topUpWallet = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const { amount, description } = req.body;
      if (!amount || amount <= 0)
        throw new AppError_default(status5.BAD_REQUEST, "amount must be a positive number");
      const data = await walletService.creditWallet(userId, Number(amount), description);
      sendResponse(res, { status: status5.OK, success: true, message: "Wallet topped up successfully", data });
    });
    getAllWallets2 = catchAsync(async (_req, res) => {
      const data = await walletService.getAllWallets();
      sendResponse(res, { status: status5.OK, success: true, message: "All wallets fetched", data });
    });
    adminCreditWallet = catchAsync(async (req, res) => {
      const { userId, amount, description } = req.body;
      if (!userId) throw new AppError_default(status5.BAD_REQUEST, "userId is required");
      if (!amount || amount <= 0) throw new AppError_default(status5.BAD_REQUEST, "amount must be a positive number");
      const data = await walletService.creditWallet(userId, Number(amount), description);
      sendResponse(res, { status: status5.OK, success: true, message: "Wallet credited successfully", data });
    });
    getSellerWallet2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await walletService.getSellerWallet(sellerId);
      sendResponse(res, { status: status5.OK, success: true, message: "Seller wallet fetched", data });
    });
    getWithdrawals = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await walletService.getSellerWithdrawals(sellerId);
      sendResponse(res, { status: status5.OK, success: true, message: "Withdrawals fetched", data });
    });
    requestWithdrawal2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const { amount, bankName, accountNumber, branchName } = req.body;
      if (!amount || !bankName || !accountNumber)
        throw new AppError_default(status5.BAD_REQUEST, "amount, bankName and accountNumber are required");
      const data = await walletService.requestWithdrawal(
        sellerId,
        Number(amount),
        bankName,
        accountNumber,
        branchName
      );
      sendResponse(res, { status: status5.CREATED, success: true, message: "Withdrawal request submitted", data });
    });
    getAllWithdrawals2 = catchAsync(async (req, res) => {
      const statusFilter = req.query.status;
      const data = await walletService.getAllWithdrawals(statusFilter);
      sendResponse(res, { status: status5.OK, success: true, message: "All withdrawals fetched", data });
    });
    processWithdrawal2 = catchAsync(async (req, res) => {
      const { id } = req.params;
      const { action, adminNote } = req.body;
      if (!["APPROVED", "REJECTED"].includes(action))
        throw new AppError_default(status5.BAD_REQUEST, "action must be APPROVED or REJECTED");
      const data = await walletService.processWithdrawal(id, action, adminNote);
      sendResponse(res, { status: status5.OK, success: true, message: `Withdrawal ${action.toLowerCase()}`, data });
    });
    walletController = {
      getMyWallet,
      topUpWallet,
      getAllWallets: getAllWallets2,
      adminCreditWallet,
      getSellerWallet: getSellerWallet2,
      getWithdrawals,
      requestWithdrawal: requestWithdrawal2,
      getAllWithdrawals: getAllWithdrawals2,
      processWithdrawal: processWithdrawal2
    };
  }
});

// src/module/wallet/wallet.route.ts
import { Router as Router8 } from "express";
var router8, walletRouter;
var init_wallet_route = __esm({
  "src/module/wallet/wallet.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_wallet_controller();
    router8 = Router8();
    router8.get("/my", auth_middleware_default(["CUSTOMER"]), walletController.getMyWallet);
    router8.post("/topup", auth_middleware_default(["CUSTOMER"]), walletController.topUpWallet);
    router8.get("/seller/my", auth_middleware_default(["SELLER"]), walletController.getSellerWallet);
    router8.get("/seller/withdrawals", auth_middleware_default(["SELLER"]), walletController.getWithdrawals);
    router8.post("/seller/withdraw", auth_middleware_default(["SELLER"]), walletController.requestWithdrawal);
    router8.get("/", auth_middleware_default(["ADMIN"]), walletController.getAllWallets);
    router8.post("/credit", auth_middleware_default(["ADMIN"]), walletController.adminCreditWallet);
    router8.get("/admin/withdrawals", auth_middleware_default(["ADMIN"]), walletController.getAllWithdrawals);
    router8.patch("/admin/withdrawals/:id", auth_middleware_default(["ADMIN"]), walletController.processWithdrawal);
    walletRouter = router8;
  }
});

// src/module/subscription/subscription.service.ts
var calcNextRefill, createSubscription, getMySubscriptions, getSellerSubscriptions, updateSubscriptionStatus, subscriptionService;
var init_subscription_service = __esm({
  "src/module/subscription/subscription.service.ts"() {
    "use strict";
    init_prisma();
    calcNextRefill = (frequency) => {
      const now = /* @__PURE__ */ new Date();
      if (frequency === "WEEKLY") now.setDate(now.getDate() + 7);
      else if (frequency === "BIWEEKLY") now.setDate(now.getDate() + 14);
      else now.setMonth(now.getMonth() + 1);
      return now;
    };
    createSubscription = async (userId, medicineId, quantity, frequency) => {
      const medicine = await prisma.medicine.findUnique({
        where: { id: medicineId },
        select: { sellerId: true }
      });
      if (!medicine) throw new Error("Medicine not found");
      return prisma.subscription.create({
        data: {
          userId,
          medicineId,
          sellerId: medicine.sellerId,
          quantity,
          frequency,
          nextRefillAt: calcNextRefill(frequency)
        },
        include: {
          medicine: { select: { id: true, name: true, price: true, image: true } }
        }
      });
    };
    getMySubscriptions = async (userId) => {
      return prisma.subscription.findMany({
        where: { userId },
        include: {
          medicine: { select: { id: true, name: true, price: true, image: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getSellerSubscriptions = async (sellerId) => {
      return prisma.subscription.findMany({
        where: { sellerId },
        include: {
          medicine: { select: { id: true, name: true, price: true } },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    updateSubscriptionStatus = async (id, userId, status53) => {
      return prisma.subscription.update({
        where: { id, userId },
        data: { status: status53 }
      });
    };
    subscriptionService = {
      createSubscription,
      getMySubscriptions,
      getSellerSubscriptions,
      updateSubscriptionStatus
    };
  }
});

// src/module/subscription/subscription.controller.ts
import status6 from "http-status";
var createSubscription2, getMySubscriptions2, updateSubscriptionStatus2, getSellerSubscriptions2, subscriptionController;
var init_subscription_controller = __esm({
  "src/module/subscription/subscription.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_subscription_service();
    createSubscription2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const { medicineId, quantity = 1, frequency = "MONTHLY" } = req.body;
      if (!medicineId) throw new AppError_default(status6.BAD_REQUEST, "medicineId is required");
      const data = await subscriptionService.createSubscription(
        userId,
        medicineId,
        Number(quantity),
        frequency
      );
      sendResponse(res, {
        status: status6.CREATED,
        success: true,
        message: "Subscription created successfully",
        data
      });
    });
    getMySubscriptions2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const data = await subscriptionService.getMySubscriptions(userId);
      sendResponse(res, {
        status: status6.OK,
        success: true,
        message: "Subscriptions fetched",
        data
      });
    });
    updateSubscriptionStatus2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const id = String(req.params.id);
      const { status: newStatus } = req.body;
      if (!newStatus) throw new AppError_default(status6.BAD_REQUEST, "status is required");
      const data = await subscriptionService.updateSubscriptionStatus(
        id,
        userId,
        newStatus
      );
      sendResponse(res, { status: status6.OK, success: true, message: "Subscription updated", data });
    });
    getSellerSubscriptions2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await subscriptionService.getSellerSubscriptions(sellerId);
      sendResponse(res, {
        status: status6.OK,
        success: true,
        message: "Seller subscriptions fetched",
        data
      });
    });
    subscriptionController = {
      createSubscription: createSubscription2,
      getMySubscriptions: getMySubscriptions2,
      updateSubscriptionStatus: updateSubscriptionStatus2,
      getSellerSubscriptions: getSellerSubscriptions2
    };
  }
});

// src/module/subscription/subscription.route.ts
import { Router as Router9 } from "express";
var router9, subscriptionRouter;
var init_subscription_route = __esm({
  "src/module/subscription/subscription.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_subscription_controller();
    router9 = Router9();
    router9.post("/", auth_middleware_default(["CUSTOMER"]), subscriptionController.createSubscription);
    router9.get("/my", auth_middleware_default(["CUSTOMER"]), subscriptionController.getMySubscriptions);
    router9.patch("/:id/status", auth_middleware_default(["CUSTOMER"]), subscriptionController.updateSubscriptionStatus);
    router9.get("/seller", auth_middleware_default(["SELLER"]), subscriptionController.getSellerSubscriptions);
    subscriptionRouter = router9;
  }
});

// src/module/stockAlert/stockAlert.service.ts
import status7 from "http-status";
var upsertStockAlert, getSellerAlerts, getTriggeredAlerts, deleteStockAlert, stockAlertService;
var init_stockAlert_service = __esm({
  "src/module/stockAlert/stockAlert.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    upsertStockAlert = async (medicineId, threshold, isActive = true) => {
      const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
      if (!medicine) throw new AppError_default(status7.NOT_FOUND, "Medicine not found");
      return prisma.stockAlert.upsert({
        where: { medicineId },
        update: { threshold, isActive },
        create: { medicineId, threshold, isActive },
        include: {
          medicine: { select: { id: true, name: true, stock: true } }
        }
      });
    };
    getSellerAlerts = async (sellerId) => {
      return prisma.stockAlert.findMany({
        where: { medicine: { sellerId } },
        include: {
          medicine: { select: { id: true, name: true, stock: true, image: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getTriggeredAlerts = async () => {
      const alerts = await prisma.stockAlert.findMany({
        where: { isActive: true },
        include: {
          medicine: {
            select: { id: true, name: true, stock: true, image: true, seller: { select: { name: true, email: true } } }
          }
        }
      });
      return alerts.filter((a) => a.medicine.stock <= a.threshold);
    };
    deleteStockAlert = async (medicineId) => {
      return prisma.stockAlert.delete({ where: { medicineId } });
    };
    stockAlertService = {
      upsertStockAlert,
      getSellerAlerts,
      getTriggeredAlerts,
      deleteStockAlert
    };
  }
});

// src/module/stockAlert/stockAlert.controller.ts
import status8 from "http-status";
var upsertStockAlert2, getSellerAlerts2, getTriggeredAlerts2, deleteStockAlert2, stockAlertController;
var init_stockAlert_controller = __esm({
  "src/module/stockAlert/stockAlert.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_stockAlert_service();
    upsertStockAlert2 = catchAsync(async (req, res) => {
      const { medicineId, threshold, isActive = true } = req.body;
      if (!medicineId) throw new AppError_default(status8.BAD_REQUEST, "medicineId is required");
      if (threshold === void 0 || threshold < 0)
        throw new AppError_default(status8.BAD_REQUEST, "threshold must be a non-negative number");
      const data = await stockAlertService.upsertStockAlert(
        medicineId,
        Number(threshold),
        Boolean(isActive)
      );
      sendResponse(res, {
        status: status8.OK,
        success: true,
        message: "Stock alert saved",
        data
      });
    });
    getSellerAlerts2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await stockAlertService.getSellerAlerts(sellerId);
      sendResponse(res, {
        status: status8.OK,
        success: true,
        message: "Stock alerts fetched",
        data
      });
    });
    getTriggeredAlerts2 = catchAsync(async (_req, res) => {
      const data = await stockAlertService.getTriggeredAlerts();
      sendResponse(res, {
        status: status8.OK,
        success: true,
        message: "Triggered alerts fetched",
        data
      });
    });
    deleteStockAlert2 = catchAsync(async (req, res) => {
      const medicineId = String(req.params.medicineId);
      const data = await stockAlertService.deleteStockAlert(medicineId);
      sendResponse(res, { status: status8.OK, success: true, message: "Stock alert deleted", data });
    });
    stockAlertController = {
      upsertStockAlert: upsertStockAlert2,
      getSellerAlerts: getSellerAlerts2,
      getTriggeredAlerts: getTriggeredAlerts2,
      deleteStockAlert: deleteStockAlert2
    };
  }
});

// src/module/stockAlert/stockAlert.route.ts
import { Router as Router10 } from "express";
var router10, stockAlertRouter;
var init_stockAlert_route = __esm({
  "src/module/stockAlert/stockAlert.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_stockAlert_controller();
    router10 = Router10();
    router10.post("/", auth_middleware_default(["SELLER"]), stockAlertController.upsertStockAlert);
    router10.get("/my", auth_middleware_default(["SELLER"]), stockAlertController.getSellerAlerts);
    router10.delete("/:medicineId", auth_middleware_default(["SELLER"]), stockAlertController.deleteStockAlert);
    router10.get("/triggered", auth_middleware_default(["ADMIN"]), stockAlertController.getTriggeredAlerts);
    stockAlertRouter = router10;
  }
});

// src/module/medicineBatch/medicineBatch.service.ts
import status9 from "http-status";
var createBatch, getSellerBatches, getExpiringBatches, deleteBatch, medicineBatchService;
var init_medicineBatch_service = __esm({
  "src/module/medicineBatch/medicineBatch.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    createBatch = async (sellerId, input) => {
      const medicine = await prisma.medicine.findFirst({
        where: { id: input.medicineId, sellerId }
      });
      if (!medicine) {
        throw new AppError_default(status9.NOT_FOUND, "Medicine not found or not owned by you");
      }
      return prisma.medicineBatch.create({
        data: {
          medicineId: input.medicineId,
          batchNumber: input.batchNumber,
          quantity: input.quantity,
          expiryDate: new Date(input.expiryDate),
          ...input.purchaseDate ? { purchaseDate: new Date(input.purchaseDate) } : {}
        },
        include: {
          medicine: { select: { id: true, name: true } }
        }
      });
    };
    getSellerBatches = async (sellerId) => {
      return prisma.medicineBatch.findMany({
        where: { medicine: { sellerId } },
        include: {
          medicine: { select: { id: true, name: true, stock: true } }
        },
        orderBy: { expiryDate: "asc" }
      });
    };
    getExpiringBatches = async (sellerId, daysAhead = 30) => {
      const cutoff = /* @__PURE__ */ new Date();
      cutoff.setDate(cutoff.getDate() + daysAhead);
      return prisma.medicineBatch.findMany({
        where: {
          medicine: { sellerId },
          expiryDate: { lte: cutoff }
        },
        include: {
          medicine: { select: { id: true, name: true } }
        },
        orderBy: { expiryDate: "asc" }
      });
    };
    deleteBatch = async (id, sellerId) => {
      const batch = await prisma.medicineBatch.findFirst({
        where: { id, medicine: { sellerId } }
      });
      if (!batch) throw new AppError_default(status9.NOT_FOUND, "Batch not found");
      return prisma.medicineBatch.delete({ where: { id } });
    };
    medicineBatchService = {
      createBatch,
      getSellerBatches,
      getExpiringBatches,
      deleteBatch
    };
  }
});

// src/module/medicineBatch/medicineBatch.controller.ts
import status10 from "http-status";
var createBatch2, getSellerBatches2, getExpiringBatches2, deleteBatch2, medicineBatchController;
var init_medicineBatch_controller = __esm({
  "src/module/medicineBatch/medicineBatch.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_medicineBatch_service();
    createBatch2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const { medicineId, batchNumber, quantity, expiryDate, purchaseDate } = req.body;
      if (!medicineId || !batchNumber || !quantity || !expiryDate)
        throw new AppError_default(
          status10.BAD_REQUEST,
          "medicineId, batchNumber, quantity, and expiryDate are required"
        );
      const data = await medicineBatchService.createBatch(sellerId, {
        medicineId,
        batchNumber,
        quantity: Number(quantity),
        expiryDate,
        purchaseDate
      });
      sendResponse(res, {
        status: status10.CREATED,
        success: true,
        message: "Batch created successfully",
        data
      });
    });
    getSellerBatches2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await medicineBatchService.getSellerBatches(sellerId);
      sendResponse(res, {
        status: status10.OK,
        success: true,
        message: "Batches fetched successfully",
        data
      });
    });
    getExpiringBatches2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const days = Number(req.query.days ?? 30);
      const data = await medicineBatchService.getExpiringBatches(sellerId, days);
      sendResponse(res, {
        status: status10.OK,
        success: true,
        message: "Expiring batches fetched",
        data
      });
    });
    deleteBatch2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const id = String(req.params.id);
      const data = await medicineBatchService.deleteBatch(id, sellerId);
      sendResponse(res, { status: status10.OK, success: true, message: "Batch deleted", data });
    });
    medicineBatchController = {
      createBatch: createBatch2,
      getSellerBatches: getSellerBatches2,
      getExpiringBatches: getExpiringBatches2,
      deleteBatch: deleteBatch2
    };
  }
});

// src/module/medicineBatch/medicineBatch.route.ts
import { Router as Router11 } from "express";
var router11, medicineBatchRouter;
var init_medicineBatch_route = __esm({
  "src/module/medicineBatch/medicineBatch.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_medicineBatch_controller();
    router11 = Router11();
    router11.post("/", auth_middleware_default(["SELLER"]), medicineBatchController.createBatch);
    router11.get("/my", auth_middleware_default(["SELLER"]), medicineBatchController.getSellerBatches);
    router11.get("/expiring", auth_middleware_default(["SELLER"]), medicineBatchController.getExpiringBatches);
    router11.delete("/:id", auth_middleware_default(["SELLER"]), medicineBatchController.deleteBatch);
    medicineBatchRouter = router11;
  }
});

// src/module/search/search.service.ts
var advancedSearch, getGenericAlternatives, searchService;
var init_search_service = __esm({
  "src/module/search/search.service.ts"() {
    "use strict";
    init_prisma();
    advancedSearch = async (filters) => {
      const {
        name,
        genericName,
        manufacturer,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        sortBy = "newest"
      } = filters;
      const where = {};
      if (name) where.name = { contains: String(name), mode: "insensitive" };
      if (genericName) where.genericName = { contains: String(genericName), mode: "insensitive" };
      if (manufacturer) where.manufacturer = { contains: String(manufacturer), mode: "insensitive" };
      if (categoryId) where.categoryId = categoryId;
      if (inStock === "true") where.stock = { gt: 0 };
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }
      const orderBy = sortBy === "price_asc" ? { price: "asc" } : sortBy === "price_desc" ? { price: "desc" } : sortBy === "name_asc" ? { name: "asc" } : { createdAt: "desc" };
      const medicines = await prisma.medicine.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } }
        },
        orderBy
      });
      return medicines;
    };
    getGenericAlternatives = async (medicineId) => {
      const source = await prisma.medicine.findUnique({
        where: { id: medicineId },
        select: { genericName: true, name: true, id: true }
      });
      if (!source || !source.genericName) {
        return { source, alternatives: [] };
      }
      const alternatives = await prisma.medicine.findMany({
        where: {
          genericName: { equals: source.genericName, mode: "insensitive" },
          id: { not: medicineId },
          stock: { gt: 0 }
        },
        include: {
          category: { select: { name: true } },
          seller: { select: { name: true } }
        },
        orderBy: { price: "asc" }
      });
      return { source, alternatives };
    };
    searchService = {
      advancedSearch,
      getGenericAlternatives
    };
  }
});

// src/module/search/search.controller.ts
import status11 from "http-status";
var advancedSearch2, getGenericAlternatives2, searchController;
var init_search_controller = __esm({
  "src/module/search/search.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_search_service();
    advancedSearch2 = catchAsync(async (req, res) => {
      const filters = req.query;
      const data = await searchService.advancedSearch(filters);
      sendResponse(res, {
        status: status11.OK,
        success: true,
        message: "Search results fetched",
        data
      });
    });
    getGenericAlternatives2 = catchAsync(async (req, res) => {
      const id = String(req.params.id);
      const data = await searchService.getGenericAlternatives(id);
      sendResponse(res, { status: status11.OK, success: true, message: "Generic alternatives fetched", data });
    });
    searchController = {
      advancedSearch: advancedSearch2,
      getGenericAlternatives: getGenericAlternatives2
    };
  }
});

// src/module/search/search.route.ts
import { Router as Router12 } from "express";
var router12, searchRouter;
var init_search_route = __esm({
  "src/module/search/search.route.ts"() {
    "use strict";
    init_search_controller();
    router12 = Router12();
    router12.get("/", searchController.advancedSearch);
    router12.get("/alternatives/:id", searchController.getGenericAlternatives);
    searchRouter = router12;
  }
});

// src/module/coupon/coupon.service.ts
import status12 from "http-status";
var getAllCoupons, applyCoupon, createCoupon, toggleCoupon, deleteCoupon, couponService;
var init_coupon_service = __esm({
  "src/module/coupon/coupon.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    getAllCoupons = async (sellerId) => {
      return prisma.coupon.findMany({
        where: sellerId !== void 0 ? { sellerId } : {},
        orderBy: { createdAt: "desc" }
      });
    };
    applyCoupon = async (userId, code, orderTotal) => {
      const coupon = await prisma.coupon.findUnique({ where: { code } });
      if (!coupon || !coupon.isActive)
        throw new AppError_default(status12.BAD_REQUEST, "Invalid or inactive coupon");
      if (coupon.expiresAt && coupon.expiresAt < /* @__PURE__ */ new Date())
        throw new AppError_default(status12.BAD_REQUEST, "Coupon has expired");
      if (coupon.usedCount >= coupon.maxUses)
        throw new AppError_default(status12.BAD_REQUEST, "Coupon usage limit reached");
      if (orderTotal < coupon.minOrderAmt)
        throw new AppError_default(
          status12.BAD_REQUEST,
          `Minimum order amount for this coupon is $${coupon.minOrderAmt}`
        );
      const alreadyUsed = await prisma.couponUsage.findUnique({
        where: { couponId_userId: { couponId: coupon.id, userId } }
      });
      if (alreadyUsed)
        throw new AppError_default(status12.BAD_REQUEST, "You have already used this coupon");
      const discount = coupon.type === "PERCENTAGE" ? orderTotal * coupon.value / 100 : Math.min(coupon.value, orderTotal);
      return {
        coupon,
        discount: parseFloat(discount.toFixed(2)),
        finalTotal: parseFloat((orderTotal - discount).toFixed(2))
      };
    };
    createCoupon = async (data) => {
      const code = data.code.trim().toUpperCase();
      const couponType = data.type === "FIXED" ? "FIXED" : "PERCENTAGE";
      const exists = await prisma.coupon.findUnique({ where: { code } });
      if (exists) throw new AppError_default(status12.CONFLICT, `Coupon code "${code}" already exists`);
      return prisma.coupon.create({
        data: {
          code,
          type: couponType,
          value: Number(data.value),
          minOrderAmt: Number(data.minOrderAmt ?? 0),
          maxUses: Number(data.maxUses ?? 100),
          isActive: true,
          usedCount: 0,
          ...data.sellerId ? { sellerId: data.sellerId } : {},
          ...data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}
        }
      });
    };
    toggleCoupon = async (id) => {
      const coupon = await prisma.coupon.findUnique({ where: { id } });
      if (!coupon) throw new AppError_default(status12.NOT_FOUND, "Coupon not found");
      return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
    };
    deleteCoupon = async (id) => {
      const coupon = await prisma.coupon.findUnique({ where: { id } });
      if (!coupon) throw new AppError_default(status12.NOT_FOUND, "Coupon not found");
      return prisma.coupon.delete({ where: { id } });
    };
    couponService = {
      getAllCoupons,
      applyCoupon,
      createCoupon,
      toggleCoupon,
      deleteCoupon
    };
  }
});

// src/module/coupon/coupon.controller.ts
import status13 from "http-status";
var getAllCoupons2, createCoupon2, applyCoupon2, toggleCoupon2, deleteCoupon2, couponController;
var init_coupon_controller = __esm({
  "src/module/coupon/coupon.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_coupon_service();
    getAllCoupons2 = catchAsync(async (req, res) => {
      const sellerId = req.user.role === "SELLER" ? String(req.user.id) : void 0;
      const data = await couponService.getAllCoupons(sellerId);
      sendResponse(res, { status: status13.OK, success: true, message: "Coupons fetched", data });
    });
    createCoupon2 = catchAsync(async (req, res) => {
      const { code, type, value, minOrderAmt, maxUses, expiresAt } = req.body;
      if (!code) throw new AppError_default(status13.BAD_REQUEST, "code is required");
      if (!type) throw new AppError_default(status13.BAD_REQUEST, "type is required (PERCENTAGE or FIXED)");
      if (value === void 0 || value === null)
        throw new AppError_default(status13.BAD_REQUEST, "value is required");
      const sellerId = req.user.role === "SELLER" ? String(req.user.id) : req.body.sellerId;
      const data = await couponService.createCoupon({
        code: String(code),
        type: type === "FIXED" ? "FIXED" : "PERCENTAGE",
        value: Number(value),
        minOrderAmt: minOrderAmt !== void 0 ? Number(minOrderAmt) : 0,
        maxUses: maxUses !== void 0 ? Number(maxUses) : 100,
        ...expiresAt ? { expiresAt: String(expiresAt) } : {},
        ...sellerId ? { sellerId } : {}
      });
      sendResponse(res, { status: status13.CREATED, success: true, message: "Coupon created", data });
    });
    applyCoupon2 = catchAsync(async (req, res) => {
      const { code, orderTotal } = req.body;
      if (!code || !orderTotal)
        throw new AppError_default(status13.BAD_REQUEST, "code and orderTotal are required");
      const data = await couponService.applyCoupon(
        String(req.user.id),
        String(code),
        Number(orderTotal)
      );
      sendResponse(res, { status: status13.OK, success: true, message: "Coupon applied", data });
    });
    toggleCoupon2 = catchAsync(async (req, res) => {
      const data = await couponService.toggleCoupon(String(req.params.id));
      sendResponse(res, { status: status13.OK, success: true, message: "Coupon toggled", data });
    });
    deleteCoupon2 = catchAsync(async (req, res) => {
      await couponService.deleteCoupon(String(req.params.id));
      sendResponse(res, { status: status13.OK, success: true, message: "Coupon deleted", data: null });
    });
    couponController = {
      getAllCoupons: getAllCoupons2,
      createCoupon: createCoupon2,
      applyCoupon: applyCoupon2,
      toggleCoupon: toggleCoupon2,
      deleteCoupon: deleteCoupon2
    };
  }
});

// src/module/coupon/coupon.route.ts
import { Router as Router13 } from "express";
var router13, couponRouter;
var init_coupon_route = __esm({
  "src/module/coupon/coupon.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_coupon_controller();
    router13 = Router13();
    router13.get("/", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), couponController.getAllCoupons);
    router13.post("/apply", auth_middleware_default(["CUSTOMER"]), couponController.applyCoupon);
    router13.post("/", auth_middleware_default(["SELLER", "ADMIN"]), couponController.createCoupon);
    router13.patch("/:id/toggle", auth_middleware_default(["SELLER", "ADMIN"]), couponController.toggleCoupon);
    router13.delete("/:id", auth_middleware_default(["SELLER", "ADMIN"]), couponController.deleteCoupon);
    couponRouter = router13;
  }
});

// src/module/sellerLicense/sellerLicense.service.ts
import status14 from "http-status";
var submitLicense, getMyLicense, getAllLicenses, reviewLicense, deleteLicense, sellerLicenseService;
var init_sellerLicense_service = __esm({
  "src/module/sellerLicense/sellerLicense.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    submitLicense = async (sellerId, licenseNumber, documentUrl) => {
      return prisma.sellerLicense.upsert({
        where: { sellerId },
        update: { licenseNumber, documentUrl, status: "PENDING", adminNote: null },
        create: { sellerId, licenseNumber, documentUrl }
      });
    };
    getMyLicense = async (sellerId) => {
      return prisma.sellerLicense.findUnique({ where: { sellerId } });
    };
    getAllLicenses = async (licenseStatus) => {
      return prisma.sellerLicense.findMany({
        where: licenseStatus ? { status: licenseStatus } : {},
        include: {
          seller: { select: { id: true, name: true, email: true, image: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    reviewLicense = async (sellerId, licenseStatus, adminNote) => {
      const license = await prisma.sellerLicense.findUnique({ where: { sellerId } });
      if (!license) throw new AppError_default(status14.NOT_FOUND, "License not found");
      return prisma.sellerLicense.update({
        where: { sellerId },
        data: {
          status: licenseStatus,
          ...adminNote !== void 0 ? { adminNote } : {}
        }
      });
    };
    deleteLicense = async (licenseId) => {
      const license = await prisma.sellerLicense.findUnique({ where: { id: licenseId } });
      if (!license) throw new AppError_default(status14.NOT_FOUND, "License not found");
      return prisma.sellerLicense.delete({ where: { id: licenseId } });
    };
    sellerLicenseService = {
      submitLicense,
      getMyLicense,
      getAllLicenses,
      reviewLicense,
      deleteLicense
    };
  }
});

// src/module/sellerLicense/sellerLicense.controller.ts
import status15 from "http-status";
var submitLicense2, getMyLicense2, getAllLicenses2, reviewLicense2, deleteLicense2, sellerLicenseController;
var init_sellerLicense_controller = __esm({
  "src/module/sellerLicense/sellerLicense.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_sellerLicense_service();
    submitLicense2 = catchAsync(async (req, res) => {
      const { licenseNumber, documentUrl } = req.body;
      if (!licenseNumber || !documentUrl) throw new AppError_default(status15.BAD_REQUEST, "licenseNumber and documentUrl are required");
      const data = await sellerLicenseService.submitLicense(req.user.id, licenseNumber, documentUrl);
      sendResponse(res, { status: status15.OK, success: true, message: "License submitted", data });
    });
    getMyLicense2 = catchAsync(async (req, res) => {
      const data = await sellerLicenseService.getMyLicense(req.user.id);
      sendResponse(res, { status: status15.OK, success: true, message: "License fetched", data });
    });
    getAllLicenses2 = catchAsync(async (req, res) => {
      const licenseStatus = req.query.status;
      const data = await sellerLicenseService.getAllLicenses(licenseStatus);
      sendResponse(res, { status: status15.OK, success: true, message: "All licenses fetched", data });
    });
    reviewLicense2 = catchAsync(async (req, res) => {
      const sellerId = String(req.params.sellerId);
      const { status: licenseStatus, adminNote } = req.body;
      if (!licenseStatus) throw new AppError_default(status15.BAD_REQUEST, "status is required");
      const data = await sellerLicenseService.reviewLicense(sellerId, licenseStatus, adminNote);
      sendResponse(res, { status: status15.OK, success: true, message: "License reviewed", data });
    });
    deleteLicense2 = catchAsync(async (req, res) => {
      const licenseId = String(req.params.licenseId);
      const data = await sellerLicenseService.deleteLicense(licenseId);
      sendResponse(res, { status: status15.OK, success: true, message: "License deleted", data });
    });
    sellerLicenseController = { submitLicense: submitLicense2, getMyLicense: getMyLicense2, getAllLicenses: getAllLicenses2, reviewLicense: reviewLicense2, deleteLicense: deleteLicense2 };
  }
});

// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
var cloudinary_default;
var init_cloudinary = __esm({
  "src/lib/cloudinary.ts"() {
    "use strict";
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    cloudinary_default = cloudinary;
  }
});

// src/module/sellerLicense/sellerLicense.route.ts
import { Router as Router14 } from "express";
import multer from "multer";
import https from "https";
var router14, upload, sellerLicenseRouter;
var init_sellerLicense_route = __esm({
  "src/module/sellerLicense/sellerLicense.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_sellerLicense_controller();
    init_prisma();
    init_cloudinary();
    router14 = Router14();
    upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only JPG, PNG, WEBP, or PDF files are allowed"));
      }
    });
    router14.post("/upload", auth_middleware_default(["SELLER"]), (req, res, next) => {
      upload.single("file")(req, res, async (multerErr) => {
        if (multerErr) {
          return res.status(400).json({ success: false, message: multerErr.message || "File upload error" });
        }
        try {
          if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
          }
          const secureUrl = await new Promise((resolve, reject) => {
            const stream = cloudinary_default.uploader.upload_stream(
              {
                folder: "seller-licenses",
                resource_type: "image",
                // image pipeline: works for JPG/PNG/WEBP AND PDF
                use_filename: true,
                unique_filename: true,
                // pages: false tells Cloudinary NOT to split the PDF into pages,
                // just store the whole file as-is.
                pages: false
              },
              (error, result) => {
                if (error || !result) {
                  console.error("[upload] Cloudinary error detail:", error);
                  return reject(new Error(error?.message || "Cloudinary upload failed"));
                }
                console.log("[upload] Cloudinary secure_url:", result.secure_url);
                resolve(result.secure_url);
              }
            );
            stream.end(req.file.buffer);
          });
          return res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: { url: secureUrl }
          });
        } catch (err) {
          console.error("[upload] Cloudinary error:", err);
          return res.status(500).json({ success: false, message: err.message || "Upload failed" });
        }
      });
    });
    router14.get("/document", auth_middleware_default(["SELLER", "ADMIN"]), async (req, res) => {
      try {
        let docUrl = "";
        if (req.query.url && typeof req.query.url === "string") {
          docUrl = req.query.url;
          if (!docUrl.includes("res.cloudinary.com")) {
            return res.status(400).json({ success: false, message: "Invalid document URL" });
          }
        } else {
          const sellerId = req.user.role === "ADMIN" && req.query.sellerId ? String(req.query.sellerId) : req.user.id;
          const license = await prisma.sellerLicense.findUnique({ where: { sellerId } });
          if (!license?.documentUrl) {
            return res.status(404).json({ success: false, message: "No license document found" });
          }
          docUrl = license.documentUrl;
        }
        const uploadMarker = "/upload/";
        const afterUpload = docUrl.split(uploadMarker)[1];
        if (!afterUpload) {
          return res.status(400).json({ success: false, message: "Unrecognised document URL format" });
        }
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        const lastDot = withoutVersion.lastIndexOf(".");
        const publicId = lastDot > -1 ? withoutVersion.slice(0, lastDot) : withoutVersion;
        const format = lastDot > -1 ? withoutVersion.slice(lastDot + 1) : "pdf";
        const signedUrl = cloudinary_default.utils.private_download_url(publicId, format, {
          resource_type: "image",
          type: "upload",
          attachment: false,
          expires_at: Math.floor(Date.now() / 1e3) + 3600
          // valid 1 hour
        });
        console.log("[document] fetching signed URL:", signedUrl);
        https.get(signedUrl, (upstream) => {
          if (upstream.statusCode && upstream.statusCode >= 400) {
            console.error("[document] upstream error:", upstream.statusCode);
            return res.status(502).json({ success: false, message: "Could not fetch document from storage" });
          }
          const isPdf = /\.pdf(\?|$)/i.test(docUrl);
          const contentType = isPdf ? "application/pdf" : upstream.headers["content-type"] || "application/octet-stream";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Disposition", 'inline; filename="license.pdf"');
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          upstream.pipe(res);
        }).on("error", (err) => {
          console.error("[document] fetch error:", err);
          res.status(500).json({ success: false, message: "Failed to stream document" });
        });
      } catch (err) {
        console.error("[document] error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
      }
    });
    router14.post("/", auth_middleware_default(["SELLER"]), sellerLicenseController.submitLicense);
    router14.get("/my", auth_middleware_default(["SELLER"]), sellerLicenseController.getMyLicense);
    router14.get("/", auth_middleware_default(["ADMIN"]), sellerLicenseController.getAllLicenses);
    router14.patch("/:sellerId/review", auth_middleware_default(["ADMIN"]), sellerLicenseController.reviewLicense);
    router14.delete("/:licenseId", auth_middleware_default(["ADMIN"]), sellerLicenseController.deleteLicense);
    sellerLicenseRouter = router14;
  }
});

// src/module/notification/notification.service.ts
import status16 from "http-status";
var createNotification, getMyNotifications, markAsRead, getUnreadCount, getOrderTracking, addTrackingEvent, notificationService;
var init_notification_service = __esm({
  "src/module/notification/notification.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    createNotification = async (userId, title, body, type = "SYSTEM") => {
      return prisma.notification.create({
        data: { userId, title, body, type }
      });
    };
    getMyNotifications = async (userId, unreadOnly = false) => {
      return prisma.notification.findMany({
        where: { userId, ...unreadOnly ? { isRead: false } : {} },
        orderBy: { createdAt: "desc" },
        take: 50
      });
    };
    markAsRead = async (userId, notificationId) => {
      if (notificationId) {
        return prisma.notification.update({
          where: { id: notificationId, userId },
          data: { isRead: true }
        });
      }
      return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    };
    getUnreadCount = async (userId) => {
      return prisma.notification.count({ where: { userId, isRead: false } });
    };
    getOrderTracking = async (orderId) => {
      return prisma.orderTracking.findMany({
        where: { orderId },
        orderBy: { createdAt: "asc" }
      });
    };
    addTrackingEvent = async (orderId, trackingStatus, note) => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new AppError_default(status16.NOT_FOUND, "Order not found");
      const event = await prisma.orderTracking.create({
        data: {
          orderId,
          status: trackingStatus,
          ...note !== void 0 ? { note } : {}
        }
      });
      await createNotification(
        order.userId,
        `Order ${trackingStatus.replace(/_/g, " ")}`,
        note ?? `Your order status has been updated to ${trackingStatus}`,
        "ORDER_UPDATE"
      );
      return event;
    };
    notificationService = {
      createNotification,
      getMyNotifications,
      markAsRead,
      getUnreadCount,
      getOrderTracking,
      addTrackingEvent
    };
  }
});

// src/module/notification/notification.controller.ts
import status17 from "http-status";
var getMyNotifications2, getUnreadCount2, markAsRead2, getOrderTracking2, addTrackingEvent2, notificationController;
var init_notification_controller = __esm({
  "src/module/notification/notification.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_notification_service();
    getMyNotifications2 = catchAsync(async (req, res) => {
      const unreadOnly = req.query.unread === "true";
      const data = await notificationService.getMyNotifications(req.user.id, unreadOnly);
      sendResponse(res, { status: status17.OK, success: true, message: "Notifications fetched", data });
    });
    getUnreadCount2 = catchAsync(async (req, res) => {
      const data = await notificationService.getUnreadCount(req.user.id);
      sendResponse(res, { status: status17.OK, success: true, message: "Unread count", data });
    });
    markAsRead2 = catchAsync(async (req, res) => {
      const id = req.params.id;
      const data = await notificationService.markAsRead(req.user.id, id);
      sendResponse(res, { status: status17.OK, success: true, message: "Marked as read", data });
    });
    getOrderTracking2 = catchAsync(async (req, res) => {
      const data = await notificationService.getOrderTracking(String(req.params.orderId));
      sendResponse(res, { status: status17.OK, success: true, message: "Tracking fetched", data });
    });
    addTrackingEvent2 = catchAsync(async (req, res) => {
      const { orderId, status: trackStatus, note } = req.body;
      const data = await notificationService.addTrackingEvent(orderId, trackStatus, note);
      sendResponse(res, { status: status17.CREATED, success: true, message: "Tracking event added", data });
    });
    notificationController = {
      getMyNotifications: getMyNotifications2,
      getUnreadCount: getUnreadCount2,
      markAsRead: markAsRead2,
      getOrderTracking: getOrderTracking2,
      addTrackingEvent: addTrackingEvent2
    };
  }
});

// src/module/notification/notification.route.ts
import { Router as Router15 } from "express";
var router15, notificationRouter;
var init_notification_route = __esm({
  "src/module/notification/notification.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_notification_controller();
    router15 = Router15();
    router15.get("/", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.getMyNotifications);
    router15.get("/unread-count", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.getUnreadCount);
    router15.patch("/read-all", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.markAsRead);
    router15.patch("/:id/read", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.markAsRead);
    router15.get("/tracking/:orderId", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), notificationController.getOrderTracking);
    router15.post("/tracking", auth_middleware_default(["SELLER", "ADMIN"]), notificationController.addTrackingEvent);
    notificationRouter = router15;
  }
});

// src/module/return/return.service.ts
import status18 from "http-status";
var submitReturn, getMyReturns, getAllReturns, updateReturnStatus, returnService;
var init_return_service = __esm({
  "src/module/return/return.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    submitReturn = async (userId, orderId, reason) => {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId, status: "DELIVERED" }
      });
      if (!order)
        throw new AppError_default(status18.BAD_REQUEST, "Only delivered orders can be returned");
      const existing = await prisma.returnRequest.findUnique({ where: { orderId } });
      if (existing)
        throw new AppError_default(status18.CONFLICT, "A return request already exists for this order");
      return prisma.returnRequest.create({
        data: { orderId, userId, reason },
        include: { order: { select: { id: true, status: true, address: true } } }
      });
    };
    getMyReturns = async (userId) => {
      return prisma.returnRequest.findMany({
        where: { userId },
        include: {
          order: {
            select: { id: true, status: true, createdAt: true, address: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getAllReturns = async (returnStatus) => {
      return prisma.returnRequest.findMany({
        where: returnStatus ? { status: returnStatus } : {},
        include: {
          user: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, status: true, address: true, createdAt: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    updateReturnStatus = async (id, returnStatus, adminNote) => {
      const req = await prisma.returnRequest.findUnique({ where: { id } });
      if (!req) throw new AppError_default(status18.NOT_FOUND, "Return request not found");
      return prisma.returnRequest.update({
        where: { id },
        data: {
          status: returnStatus,
          ...adminNote !== void 0 ? { adminNote } : {}
        }
      });
    };
    returnService = {
      submitReturn,
      getMyReturns,
      getAllReturns,
      updateReturnStatus
    };
  }
});

// src/module/return/return.controller.ts
import status19 from "http-status";
var submitReturn2, getMyReturns2, getAllReturns2, updateReturnStatus2, returnController;
var init_return_controller = __esm({
  "src/module/return/return.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_return_service();
    submitReturn2 = catchAsync(async (req, res) => {
      const { orderId, reason } = req.body;
      if (!orderId || !reason) throw new AppError_default(status19.BAD_REQUEST, "orderId and reason are required");
      const data = await returnService.submitReturn(req.user.id, orderId, reason);
      sendResponse(res, { status: status19.CREATED, success: true, message: "Return request submitted", data });
    });
    getMyReturns2 = catchAsync(async (req, res) => {
      const data = await returnService.getMyReturns(req.user.id);
      sendResponse(res, { status: status19.OK, success: true, message: "Returns fetched", data });
    });
    getAllReturns2 = catchAsync(async (req, res) => {
      const returnStatus = req.query.status;
      const data = await returnService.getAllReturns(returnStatus);
      sendResponse(res, { status: status19.OK, success: true, message: "All returns fetched", data });
    });
    updateReturnStatus2 = catchAsync(async (req, res) => {
      const id = String(req.params.id);
      const { status: returnStatus, adminNote } = req.body;
      if (!returnStatus) throw new AppError_default(status19.BAD_REQUEST, "status is required");
      const data = await returnService.updateReturnStatus(id, returnStatus, adminNote);
      sendResponse(res, { status: status19.OK, success: true, message: "Return updated", data });
    });
    returnController = { submitReturn: submitReturn2, getMyReturns: getMyReturns2, getAllReturns: getAllReturns2, updateReturnStatus: updateReturnStatus2 };
  }
});

// src/module/return/return.route.ts
import { Router as Router16 } from "express";
var router16, returnRouter;
var init_return_route = __esm({
  "src/module/return/return.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_return_controller();
    router16 = Router16();
    router16.post("/", auth_middleware_default(["CUSTOMER"]), returnController.submitReturn);
    router16.get("/my", auth_middleware_default(["CUSTOMER"]), returnController.getMyReturns);
    router16.get("/", auth_middleware_default(["SELLER", "ADMIN"]), returnController.getAllReturns);
    router16.patch("/:id/status", auth_middleware_default(["ADMIN"]), returnController.updateReturnStatus);
    returnRouter = router16;
  }
});

// src/module/wishlist/wishlist.service.ts
import status20 from "http-status";
var getOrCreate, addItem, removeItem, clearWishlist, wishlistService;
var init_wishlist_service = __esm({
  "src/module/wishlist/wishlist.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    getOrCreate = async (userId) => {
      let wishlist = await prisma.wishlist.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  stock: true,
                  manufacturer: true,
                  seller: { select: { name: true } },
                  category: { select: { name: true } }
                }
              }
            },
            orderBy: { addedAt: "desc" }
          }
        }
      });
      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId },
          include: { items: { include: { medicine: { select: { id: true, name: true, price: true, image: true, stock: true, manufacturer: true, seller: { select: { name: true } }, category: { select: { name: true } } } } } } }
        });
      }
      return wishlist;
    };
    addItem = async (userId, medicineId) => {
      const wishlist = await getOrCreate(userId);
      const exists = await prisma.wishlistItem.findUnique({
        where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } }
      });
      if (exists) throw new AppError_default(status20.CONFLICT, "Item already in wishlist");
      return prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, medicineId },
        include: {
          medicine: {
            select: { id: true, name: true, price: true, image: true, stock: true }
          }
        }
      });
    };
    removeItem = async (userId, medicineId) => {
      const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
      if (!wishlist) throw new AppError_default(status20.NOT_FOUND, "Wishlist not found");
      const item = await prisma.wishlistItem.findUnique({
        where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } }
      });
      if (!item) throw new AppError_default(status20.NOT_FOUND, "Item not in wishlist");
      return prisma.wishlistItem.delete({
        where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } }
      });
    };
    clearWishlist = async (userId) => {
      const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
      if (!wishlist) return;
      return prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
    };
    wishlistService = {
      getOrCreate,
      addItem,
      removeItem,
      clearWishlist
    };
  }
});

// src/module/wishlist/wishlist.controller.ts
import status21 from "http-status";
var getWishlist, addItem2, removeItem2, clearWishlist2, wishlistController;
var init_wishlist_controller = __esm({
  "src/module/wishlist/wishlist.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_wishlist_service();
    getWishlist = catchAsync(async (req, res) => {
      const data = await wishlistService.getOrCreate(req.user.id);
      sendResponse(res, { status: status21.OK, success: true, message: "Wishlist fetched", data });
    });
    addItem2 = catchAsync(async (req, res) => {
      const { medicineId } = req.body;
      if (!medicineId) throw new AppError_default(status21.BAD_REQUEST, "medicineId is required");
      const data = await wishlistService.addItem(req.user.id, medicineId);
      sendResponse(res, { status: status21.CREATED, success: true, message: "Added to wishlist", data });
    });
    removeItem2 = catchAsync(async (req, res) => {
      const data = await wishlistService.removeItem(req.user.id, String(req.params.medicineId));
      sendResponse(res, { status: status21.OK, success: true, message: "Removed from wishlist", data });
    });
    clearWishlist2 = catchAsync(async (req, res) => {
      await wishlistService.clearWishlist(req.user.id);
      sendResponse(res, { status: status21.OK, success: true, message: "Wishlist cleared", data: null });
    });
    wishlistController = { getWishlist, addItem: addItem2, removeItem: removeItem2, clearWishlist: clearWishlist2 };
  }
});

// src/module/wishlist/wishlist.route.ts
import { Router as Router17 } from "express";
var router17, wishlistRouter;
var init_wishlist_route = __esm({
  "src/module/wishlist/wishlist.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_wishlist_controller();
    router17 = Router17();
    router17.get("/", auth_middleware_default(["CUSTOMER"]), wishlistController.getWishlist);
    router17.post("/", auth_middleware_default(["CUSTOMER"]), wishlistController.addItem);
    router17.delete("/clear", auth_middleware_default(["CUSTOMER"]), wishlistController.clearWishlist);
    router17.delete("/:medicineId", auth_middleware_default(["CUSTOMER"]), wishlistController.removeItem);
    wishlistRouter = router17;
  }
});

// src/module/subOrder/subOrder.controller.ts
import status22 from "http-status";
var getSellerSubOrders2, getOrderSubOrders2, updateSubOrderStatus2, subOrderController;
var init_subOrder_controller = __esm({
  "src/module/subOrder/subOrder.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_subOrder_service();
    getSellerSubOrders2 = catchAsync(async (req, res) => {
      const data = await subOrderService.getSellerSubOrders(req.user.id);
      sendResponse(res, { status: status22.OK, success: true, message: "Sub-orders fetched", data });
    });
    getOrderSubOrders2 = catchAsync(async (req, res) => {
      const data = await subOrderService.getOrderSubOrders(String(req.params.orderId), req.user.id);
      sendResponse(res, { status: status22.OK, success: true, message: "Order sub-orders fetched", data });
    });
    updateSubOrderStatus2 = catchAsync(async (req, res) => {
      const { status: orderStatus } = req.body;
      const data = await subOrderService.updateSubOrderStatus(String(req.params.id), req.user.id, orderStatus);
      sendResponse(res, { status: status22.OK, success: true, message: "Sub-order updated", data });
    });
    subOrderController = { getSellerSubOrders: getSellerSubOrders2, getOrderSubOrders: getOrderSubOrders2, updateSubOrderStatus: updateSubOrderStatus2 };
  }
});

// src/module/subOrder/subOrder.route.ts
import { Router as Router18 } from "express";
var router18, subOrderRouter;
var init_subOrder_route = __esm({
  "src/module/subOrder/subOrder.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_subOrder_controller();
    router18 = Router18();
    router18.get("/my", auth_middleware_default(["SELLER"]), subOrderController.getSellerSubOrders);
    router18.patch("/:id/status", auth_middleware_default(["SELLER"]), subOrderController.updateSubOrderStatus);
    router18.get("/order/:orderId", auth_middleware_default(["CUSTOMER"]), subOrderController.getOrderSubOrders);
    subOrderRouter = router18;
  }
});

// src/module/banner/banner.route.ts
import { Router as Router19 } from "express";
import status23 from "http-status";
var router19, bannerRouter;
var init_banner_route = __esm({
  "src/module/banner/banner.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_auth_middleware();
    router19 = Router19();
    router19.get("/", catchAsync(async (req, res) => {
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : void 0;
      const banners = await prisma.banner.findMany({
        where: isActive !== void 0 ? { isActive } : {},
        orderBy: { sortOrder: "asc" }
      });
      sendResponse(res, { status: status23.OK, success: true, message: "Banners fetched", data: banners });
    }));
    router19.post("/", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder } = req.body;
      if (!title) throw new AppError_default(status23.BAD_REQUEST, "title is required");
      const banner = await prisma.banner.create({
        data: { title, subtitle, badge, color: color || "#1B3A5C", textColor: textColor || "#FFFFFF", icon, imageUrl, link, isActive: isActive ?? true, sortOrder: Number(sortOrder) || 0 }
      });
      sendResponse(res, { status: status23.CREATED, success: true, message: "Banner created", data: banner });
    }));
    router19.put("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder } = req.body;
      const banner = await prisma.banner.update({
        where: { id: req.params.id },
        data: { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder: sortOrder !== void 0 ? Number(sortOrder) : void 0 }
      });
      sendResponse(res, { status: status23.OK, success: true, message: "Banner updated", data: banner });
    }));
    router19.delete("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.banner.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status23.OK, success: true, message: "Banner deleted", data: null });
    }));
    bannerRouter = router19;
  }
});

// src/module/platformFeature/platformFeature.route.ts
import { Router as Router20 } from "express";
import status24 from "http-status";
var router20, platformFeatureRouter;
var init_platformFeature_route = __esm({
  "src/module/platformFeature/platformFeature.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_AppError();
    init_auth_middleware();
    router20 = Router20();
    router20.get("/", catchAsync(async (req, res) => {
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : void 0;
      const features = await prisma.platformFeature.findMany({
        where: isActive !== void 0 ? { isActive } : {},
        orderBy: { sortOrder: "asc" }
      });
      sendResponse(res, { status: status24.OK, success: true, message: "Features fetched", data: features });
    }));
    router20.post("/", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, description, icon, isActive, sortOrder } = req.body;
      if (!title || !description || !icon) throw new AppError_default(status24.BAD_REQUEST, "title, description, icon required");
      const feat = await prisma.platformFeature.create({
        data: { title, description, icon, isActive: isActive ?? true, sortOrder: Number(sortOrder) || 0 }
      });
      sendResponse(res, { status: status24.CREATED, success: true, message: "Feature created", data: feat });
    }));
    router20.put("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, description, icon, isActive, sortOrder } = req.body;
      const feat = await prisma.platformFeature.update({
        where: { id: req.params.id },
        data: { title, description, icon, isActive, sortOrder: sortOrder !== void 0 ? Number(sortOrder) : void 0 }
      });
      sendResponse(res, { status: status24.OK, success: true, message: "Feature updated", data: feat });
    }));
    router20.delete("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.platformFeature.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status24.OK, success: true, message: "Feature deleted", data: null });
    }));
    platformFeatureRouter = router20;
  }
});

// src/module/flashSale/flashSale.route.ts
import { Router as Router21 } from "express";
import status25 from "http-status";
var router21, flashSaleRouter;
var init_flashSale_route = __esm({
  "src/module/flashSale/flashSale.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_auth_middleware();
    init_AppError();
    router21 = Router21();
    router21.get("/active", catchAsync(async (req, res) => {
      const now = /* @__PURE__ */ new Date();
      const sales = await prisma.flashSale.findMany({
        where: { isApproved: true, startAt: { lte: now }, endAt: { gte: now } },
        include: {
          medicine: { select: { id: true, name: true, image: true, manufacturer: true, categoryId: true } },
          seller: { select: { id: true, name: true } }
        },
        orderBy: { endAt: "asc" }
      });
      sendResponse(res, { status: status25.OK, success: true, message: "Active flash sales", data: sales });
    }));
    router21.get("/my", auth_middleware_default(["SELLER"]), catchAsync(async (req, res) => {
      const sales = await prisma.flashSale.findMany({
        where: { sellerId: req.user.id },
        include: { medicine: { select: { id: true, name: true, image: true, price: true } } },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status25.OK, success: true, message: "My flash sales", data: sales });
    }));
    router21.post("/", auth_middleware_default(["SELLER"]), catchAsync(async (req, res) => {
      const license = await prisma.sellerLicense.findUnique({ where: { sellerId: req.user.id } });
      if (!license || license.status !== "VERIFIED") {
        throw new AppError_default(
          status25.FORBIDDEN,
          "Your seller license must be approved (VERIFIED) by an admin before you can create flash sales."
        );
      }
      const { medicineId, discountPrice, saleStock, startAt, endAt } = req.body;
      if (!medicineId || !discountPrice || !saleStock || !startAt || !endAt)
        throw new AppError_default(status25.BAD_REQUEST, "medicineId, discountPrice, saleStock, startAt, endAt required");
      const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
      if (!medicine) throw new AppError_default(status25.NOT_FOUND, "Medicine not found");
      if (medicine.sellerId !== req.user.id) throw new AppError_default(status25.FORBIDDEN, "Not your medicine");
      if (Number(saleStock) > medicine.stock) {
        throw new AppError_default(
          status25.BAD_REQUEST,
          `Flash sale stock (${saleStock}) cannot exceed the medicine's total available stock (${medicine.stock}).`
        );
      }
      if (Number(discountPrice) >= medicine.price) {
        throw new AppError_default(
          status25.BAD_REQUEST,
          `Discount price (${discountPrice}) must be lower than the original price (${medicine.price}).`
        );
      }
      const sale = await prisma.flashSale.create({
        data: {
          medicineId,
          sellerId: req.user.id,
          originalPrice: medicine.price,
          discountPrice: Number(discountPrice),
          saleStock: Number(saleStock),
          startAt: new Date(startAt),
          endAt: new Date(endAt)
        },
        include: { medicine: { select: { id: true, name: true, image: true, price: true } } }
      });
      sendResponse(res, { status: status25.CREATED, success: true, message: "Flash sale submitted for approval", data: sale });
    }));
    router21.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const sale = await prisma.flashSale.findUnique({ where: { id: req.params.id } });
      if (!sale) throw new AppError_default(status25.NOT_FOUND, "Flash sale not found");
      await prisma.flashSale.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status25.OK, success: true, message: "Flash sale removed", data: null });
    }));
    router21.delete("/:id", auth_middleware_default(["SELLER"]), catchAsync(async (req, res) => {
      const sale = await prisma.flashSale.findUnique({ where: { id: req.params.id } });
      if (!sale) throw new AppError_default(status25.NOT_FOUND, "Flash sale not found");
      if (sale.sellerId !== req.user.id) throw new AppError_default(status25.FORBIDDEN, "Forbidden");
      await prisma.flashSale.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status25.OK, success: true, message: "Flash sale cancelled", data: null });
    }));
    router21.get("/admin/all", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const sales = await prisma.flashSale.findMany({
        include: {
          medicine: { select: { id: true, name: true, image: true, price: true } },
          seller: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status25.OK, success: true, message: "All flash sales", data: sales });
    }));
    router21.patch("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { isApproved, adminNote } = req.body;
      const sale = await prisma.flashSale.update({
        where: { id: req.params.id },
        data: { isApproved, adminNote },
        include: { medicine: { select: { id: true, name: true } } }
      });
      sendResponse(res, { status: status25.OK, success: true, message: `Flash sale ${isApproved ? "approved" : "rejected"}`, data: sale });
    }));
    flashSaleRouter = router21;
  }
});

// src/module/blog/blog.route.ts
import { Router as Router22 } from "express";
import status26 from "http-status";
var makeSlug, router22, blogRouter;
var init_blog_route = __esm({
  "src/module/blog/blog.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_auth_middleware();
    makeSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    router22 = Router22();
    router22.get("/", catchAsync(async (req, res) => {
      const featured = req.query.featured === "true";
      const limit = Number(req.query.limit) || 20;
      const blogs = await prisma.blog.findMany({
        where: { isPublished: true, ...featured ? { isFeatured: true } : {} },
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { publishedAt: "desc" },
        take: limit
      });
      sendResponse(res, { status: status26.OK, success: true, message: "Blogs fetched", data: blogs });
    }));
    router22.get("/my/list", auth_middleware_default(), catchAsync(async (req, res) => {
      const blogs = await prisma.blog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status26.OK, success: true, message: "My blogs", data: blogs });
    }));
    router22.get("/admin/all", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const blogs = await prisma.blog.findMany({
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status26.OK, success: true, message: "All blogs", data: blogs });
    }));
    router22.get("/:slug", catchAsync(async (req, res) => {
      const blog = await prisma.blog.findUnique({
        where: { slug: req.params.slug },
        include: { author: { select: { id: true, name: true, image: true } } }
      });
      if (!blog || !blog.isPublished) {
        return sendResponse(res, { status: status26.NOT_FOUND, success: false, message: "Blog not found", data: null });
      }
      sendResponse(res, { status: status26.OK, success: true, message: "Blog fetched", data: blog });
    }));
    router22.post("/", auth_middleware_default(), catchAsync(async (req, res) => {
      const { title, summary, content, image, tags } = req.body;
      if (!title || !summary || !content) {
        return sendResponse(res, { status: status26.BAD_REQUEST, success: false, message: "title, summary, content required", data: null });
      }
      const baseSlug = makeSlug(title);
      let slug = baseSlug;
      let i = 1;
      while (await prisma.blog.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
      const blog = await prisma.blog.create({
        data: {
          userId: req.user.id,
          title,
          slug,
          summary,
          content,
          image: image || null,
          tags: Array.isArray(tags) ? tags : tags ? [tags] : []
        },
        include: { author: { select: { id: true, name: true, image: true } } }
      });
      sendResponse(res, { status: status26.CREATED, success: true, message: "Blog submitted for review", data: blog });
    }));
    router22.put("/:id", auth_middleware_default(), catchAsync(async (req, res) => {
      const { id } = req.params;
      const { title, summary, content, image, tags } = req.body;
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (!existing) {
        return sendResponse(res, { status: status26.NOT_FOUND, success: false, message: "Blog not found", data: null });
      }
      if (existing.userId !== req.user.id && req.user.role !== "ADMIN") {
        return sendResponse(res, { status: status26.FORBIDDEN, success: false, message: "Not authorized to edit this blog", data: null });
      }
      const shouldReset = req.user.role !== "ADMIN";
      let slug = existing.slug;
      if (title && title.trim() !== existing.title) {
        const baseSlug = makeSlug(title.trim());
        slug = baseSlug;
        let i = 1;
        while (await prisma.blog.findFirst({ where: { slug, NOT: { id } } })) {
          slug = `${baseSlug}-${i++}`;
        }
      }
      const blog = await prisma.blog.update({
        where: { id },
        data: {
          ...title ? { title: title.trim(), slug } : {},
          ...summary ? { summary: summary.trim() } : {},
          ...content ? { content: content.trim() } : {},
          image: image !== void 0 ? image || null : existing.image,
          tags: Array.isArray(tags) ? tags : tags ? [tags] : existing.tags,
          ...shouldReset ? { isPublished: false, isFeatured: false, publishedAt: null } : {}
        },
        include: { author: { select: { id: true, name: true, image: true } } }
      });
      sendResponse(res, { status: status26.OK, success: true, message: shouldReset ? "Blog updated \u2014 pending admin review" : "Blog updated", data: blog });
    }));
    router22.patch("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { isPublished, isFeatured } = req.body;
      const blog = await prisma.blog.update({
        where: { id: req.params.id },
        data: {
          ...isPublished !== void 0 ? { isPublished, publishedAt: isPublished ? /* @__PURE__ */ new Date() : null } : {},
          ...isFeatured !== void 0 ? { isFeatured } : {}
        },
        include: { author: { select: { id: true, name: true, image: true } } }
      });
      sendResponse(res, { status: status26.OK, success: true, message: "Blog updated", data: blog });
    }));
    router22.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.blog.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status26.OK, success: true, message: "Blog deleted", data: null });
    }));
    blogRouter = router22;
  }
});

// src/module/testimonial/testimonial.route.ts
import { Router as Router23 } from "express";
import status27 from "http-status";
var router23, testimonialRouter;
var init_testimonial_route = __esm({
  "src/module/testimonial/testimonial.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_auth_middleware();
    router23 = Router23();
    router23.get("/", catchAsync(async (req, res) => {
      const approved = req.query.approved === "true" ? true : void 0;
      const featured = req.query.featured === "true" ? true : void 0;
      const limit = Number(req.query.limit) || 50;
      const testimonials = await prisma.testimonial.findMany({
        where: {
          ...approved !== void 0 ? { isApproved: approved } : {},
          ...featured !== void 0 ? { isFeatured: featured } : {}
        },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: limit
      });
      sendResponse(res, { status: status27.OK, success: true, message: "Testimonials fetched", data: testimonials });
    }));
    router23.post("/", auth_middleware_default(), catchAsync(async (req, res) => {
      const { content, rating } = req.body;
      if (!content) return sendResponse(res, { status: status27.BAD_REQUEST, success: false, message: "content required", data: null });
      const t = await prisma.testimonial.create({
        data: { userId: req.user.id, content, rating: Math.min(5, Math.max(1, Number(rating) || 5)) },
        include: { user: { select: { id: true, name: true, image: true } } }
      });
      sendResponse(res, { status: status27.CREATED, success: true, message: "Testimonial submitted for review", data: t });
    }));
    router23.get("/admin/all", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const testimonials = await prisma.testimonial.findMany({
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status27.OK, success: true, message: "All testimonials", data: testimonials });
    }));
    router23.patch("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { isApproved, isFeatured } = req.body;
      const t = await prisma.testimonial.update({
        where: { id: req.params.id },
        data: {
          ...isApproved !== void 0 ? { isApproved } : {},
          ...isFeatured !== void 0 ? { isFeatured } : {}
        },
        include: { user: { select: { id: true, name: true, image: true } } }
      });
      sendResponse(res, { status: status27.OK, success: true, message: "Testimonial updated", data: t });
    }));
    router23.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.testimonial.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status27.OK, success: true, message: "Testimonial deleted", data: null });
    }));
    testimonialRouter = router23;
  }
});

// src/module/newsletter/newsletter.route.ts
import { Router as Router24 } from "express";
import status28 from "http-status";
var router24, newsletterRouter;
var init_newsletter_route = __esm({
  "src/module/newsletter/newsletter.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_auth_middleware();
    router24 = Router24();
    router24.post("/subscribe", catchAsync(async (req, res) => {
      const { email, name } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return sendResponse(res, { status: status28.BAD_REQUEST, success: false, message: "Valid email required", data: null });
      const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (existing)
        return sendResponse(res, { status: status28.CONFLICT, success: false, message: "Already subscribed", data: null });
      const sub = await prisma.newsletterSubscriber.create({ data: { email, name } });
      sendResponse(res, { status: status28.CREATED, success: true, message: "Subscribed successfully", data: sub });
    }));
    router24.get("/", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "desc" } });
      sendResponse(res, { status: status28.OK, success: true, message: "Subscribers fetched", data: subscribers });
    }));
    router24.delete("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status28.OK, success: true, message: "Subscriber removed", data: null });
    }));
    newsletterRouter = router24;
  }
});

// src/module/payment/payment.route.ts
import Stripe from "stripe";
import { Router as Router25 } from "express";
var router25, stripe, paymentRouter;
var init_payment_route = __esm({
  "src/module/payment/payment.route.ts"() {
    "use strict";
    init_auth_middleware();
    router25 = Router25();
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
    router25.post("/intent", auth_middleware_default(["CUSTOMER"]), async (req, res) => {
      try {
        const { amount, currency = "usd" } = req.body;
        if (!amount || isNaN(Number(amount))) {
          return res.status(400).json({ success: false, message: "Valid amount (in cents) is required" });
        }
        if (!process.env.STRIPE_SECRET_KEY) {
          return res.status(500).json({ success: false, message: "STRIPE_SECRET_KEY is not configured" });
        }
        const intent = await stripe.paymentIntents.create({
          amount: Math.round(Number(amount)),
          currency,
          automatic_payment_methods: { enabled: true },
          metadata: { userId: String(req.user.id) }
        });
        res.json({
          success: true,
          message: "Payment intent created",
          data: { clientSecret: intent.client_secret, paymentIntentId: intent.id }
        });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Stripe error" });
      }
    });
    paymentRouter = router25;
  }
});

// src/module/contact/contact.route.ts
import { Router as Router26 } from "express";
import status29 from "http-status";
var router26, contactRouter;
var init_contact_route = __esm({
  "src/module/contact/contact.route.ts"() {
    "use strict";
    init_prisma();
    init_catchAsync();
    init_sendResponse();
    init_auth_middleware();
    init_AppError();
    router26 = Router26();
    router26.post("/", catchAsync(async (req, res) => {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message)
        throw new AppError_default(status29.BAD_REQUEST, "name, email, message are required");
      const msg = await prisma.contactMessage.create({
        data: { name, email, subject: subject || null, message }
      });
      sendResponse(res, { status: status29.CREATED, success: true, message: "Message sent successfully", data: msg });
    }));
    router26.get("/my", auth_middleware_default(["CUSTOMER"]), catchAsync(async (req, res) => {
      const email = req.user.email;
      const messages = await prisma.contactMessage.findMany({
        where: { email },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status29.OK, success: true, message: "Your tickets fetched", data: messages });
    }));
    router26.get("/admin/messages", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const statusFilter = req.query.status;
      const messages = await prisma.contactMessage.findMany({
        where: statusFilter ? { status: statusFilter } : void 0,
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status29.OK, success: true, message: "Messages fetched", data: messages });
    }));
    router26.patch("/admin/:id/status", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { status: newStatus } = req.body;
      if (!["UNREAD", "READ", "ARCHIVED"].includes(newStatus))
        throw new AppError_default(status29.BAD_REQUEST, "Invalid status");
      const msg = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: { status: newStatus }
      });
      sendResponse(res, { status: status29.OK, success: true, message: "Status updated", data: msg });
    }));
    router26.post("/admin/:id/reply", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { reply } = req.body;
      if (!reply) throw new AppError_default(status29.BAD_REQUEST, "reply text required");
      const msg = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
      if (!msg) throw new AppError_default(status29.NOT_FOUND, "Message not found");
      const updated = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: { adminReply: reply, repliedAt: /* @__PURE__ */ new Date(), status: "READ" }
      });
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: `"MediStore Support" <${process.env.SMTP_USER}>`,
          to: msg.email,
          subject: `Re: ${msg.subject || "Your inquiry"} \u2014 MediStore`,
          html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
          <div style="background:#1B3A5C;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">\u{1F48A} MediStore</h1>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#5C4033;">Dear <strong>${msg.name}</strong>,</p>
            <p style="color:#5C4033;">Thank you for contacting us. Here is our response to your inquiry:</p>
            <blockquote style="background:#F5EDE3;border-left:4px solid #C2703A;padding:16px;border-radius:4px;color:#1B3A5C;font-style:italic;">
              ${reply.replace(/\n/g, "<br>")}
            </blockquote>
            <p style="color:#5C4033;margin-top:16px;">Your original message:</p>
            <blockquote style="background:#f5f5f5;border-left:4px solid #ccc;padding:12px;color:#888;font-size:13px;">
              ${msg.message.replace(/\n/g, "<br>")}
            </blockquote>
            <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
            <p style="color:#8A6650;font-size:12px;">MediStore \u2014 Your Trusted Online Pharmacy<br>support@medistore.com</p>
          </div>
        </div>
      `
        });
      } catch (emailErr) {
        console.error("Email send failed (reply stored anyway):", emailErr);
      }
      sendResponse(res, { status: status29.OK, success: true, message: "Reply sent and stored", data: updated });
    }));
    router26.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.contactMessage.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status29.OK, success: true, message: "Message deleted", data: null });
    }));
    contactRouter = router26;
  }
});

// src/config/env.ts
import dotenv from "dotenv";
import status30 from "http-status";
var loadEnvVariables, envVars;
var init_env = __esm({
  "src/config/env.ts"() {
    "use strict";
    init_AppError();
    dotenv.config();
    loadEnvVariables = () => {
      const requireEnvVariable = [
        "BACKEND_URL",
        "ORIGIN_URL",
        "BETTER_AUTH_URL",
        "DATABASE_URL",
        "BETTER_AUTH_URL",
        "BETTER_AUTH_SECRET",
        "NODE_ENV",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
      ];
      requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
          throw new AppError_default(status30.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
        }
      });
      return {
        BACKEND_URL: process.env.BACKEND_URL,
        ORIGIN_URL: process.env.ORIGIN_URL,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        CLOUDINARY: {
          CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
        }
      };
    };
    envVars = loadEnvVariables();
  }
});

// src/config/cloudinary.config.ts
import { v2 as cloudinary2 } from "cloudinary";
import status31 from "http-status";
var deleteFileFromCloudinary;
var init_cloudinary_config = __esm({
  "src/config/cloudinary.config.ts"() {
    "use strict";
    init_AppError();
    init_env();
    cloudinary2.config({
      cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
      api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
      api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
    });
    deleteFileFromCloudinary = async (url) => {
      try {
        const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
        const match = url.match(regex);
        if (match && match[1]) {
          const publicId = match[1];
          const isRaw = url.includes("/raw/upload/");
          const resourceType = isRaw ? "raw" : "image";
          await cloudinary2.uploader.destroy(
            publicId,
            {
              resource_type: resourceType
            }
          );
        }
      } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw new AppError_default(status31.INTERNAL_SERVER_ERROR, "Failed to delete file from Cloudinary");
      }
    };
  }
});

// src/errorHelpers/handleZodError.ts
import status32 from "http-status";
var handleZodError;
var init_handleZodError = __esm({
  "src/errorHelpers/handleZodError.ts"() {
    "use strict";
    handleZodError = (err) => {
      const statusCode = status32.BAD_REQUEST;
      const message = "Zod Validation Error";
      const errorSources = [];
      err.issues.forEach((issue) => {
        errorSources.push({
          path: issue.path.join(" => "),
          message: issue.message
        });
      });
      return {
        success: false,
        message,
        errorSources,
        statusCode
      };
    };
  }
});

// src/middleware/globalErrorHandler.ts
import status33 from "http-status";
import z4 from "zod";
var globalErrorHandler;
var init_globalErrorHandler = __esm({
  "src/middleware/globalErrorHandler.ts"() {
    "use strict";
    init_cloudinary_config();
    init_env();
    init_AppError();
    init_handleZodError();
    globalErrorHandler = async (err, req, res, next) => {
      if (envVars.NODE_ENV === "development") {
        console.log("Error from Global Error Handler", err);
      }
      if (req.file) {
        await deleteFileFromCloudinary(req.file.path);
      }
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const imageUrls = req.files.map((file) => file.path);
        await Promise.all(imageUrls.map((url) => deleteFileFromCloudinary(url)));
      }
      let errorSources = [];
      let statusCode = status33.INTERNAL_SERVER_ERROR;
      let message = "Internal Server Error";
      let stack = void 0;
      if (err instanceof z4.ZodError) {
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = [...simplifiedError.errorSources];
        stack = err.stack;
      } else if (err instanceof AppError_default) {
        statusCode = err.statusCode;
        message = err.message;
        stack = err.stack;
        errorSources = [
          {
            path: "",
            message: err.message
          }
        ];
      } else if (err instanceof Error) {
        statusCode = status33.INTERNAL_SERVER_ERROR;
        message = err.message;
        stack = err.stack;
        errorSources = [
          {
            path: "",
            message: err.message
          }
        ];
      }
      const errorResponse = {
        success: false,
        message,
        errorSources,
        error: envVars.NODE_ENV === "development" ? err : void 0,
        stack: envVars.NODE_ENV === "development" ? stack : void 0
      };
      res.status(statusCode).json(errorResponse);
    };
  }
});

// src/module/dashboard/dashboard.service.ts
var getAdminDashboardService, getSellerDashboardService, getCustomerDashboardService, dashboardService;
var init_dashboard_service = __esm({
  "src/module/dashboard/dashboard.service.ts"() {
    "use strict";
    init_prisma();
    getAdminDashboardService = async () => {
      const [
        totalUsers,
        totalCustomers,
        totalSellers,
        totalAdmins,
        totalMedicines,
        totalOrders,
        placedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalCartItems,
        totalCartQtyAgg,
        totalReviews,
        avgRatingAgg,
        revenueAgg,
        pendingLicenses,
        recentOrders
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
            items: { select: { price: true, quantity: true } }
          }
        })
      ]);
      const totalRevenue = revenueAgg._sum.price ?? 0;
      const recentOrdersMapped = recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        customer: o.user?.name ?? "Unknown",
        total: o.items?.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0) ?? 0
      }));
      return {
        users: { total: totalUsers, customers: totalCustomers, sellers: totalSellers, admins: totalAdmins },
        medicines: { total: totalMedicines },
        orders: { total: totalOrders, placed: placedOrders, processing: processingOrders, shipped: shippedOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
        cart: { totalItems: totalCartItems, totalQuantity: totalCartQtyAgg._sum.quantity ?? 0 },
        reviews: { total: totalReviews, averageRating: Number((avgRatingAgg._avg.rating ?? 0).toFixed(2)) },
        revenue: { total: totalRevenue },
        pendingLicenses,
        recentOrders: recentOrdersMapped
      };
    };
    getSellerDashboardService = async (sellerId) => {
      const LOW_STOCK_THRESHOLD = 10;
      const [
        totalMedicines,
        outOfStock,
        lowStock,
        avgPriceAgg,
        allOrders,
        ordersByStatusRaw,
        lowStockMeds,
        recentOrders
      ] = await Promise.all([
        prisma.medicine.count({ where: { sellerId } }),
        prisma.medicine.count({ where: { sellerId, stock: 0 } }),
        prisma.medicine.count({ where: { sellerId, stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
        prisma.medicine.aggregate({ where: { sellerId }, _avg: { price: true }, _sum: { stock: true } }),
        prisma.order.findMany({
          where: { items: { some: { medicine: { sellerId } } } },
          include: { items: { select: { quantity: true, price: true, medicine: { select: { sellerId: true } } } } }
        }),
        prisma.order.groupBy({
          by: ["status"],
          where: { items: { some: { medicine: { sellerId } } } },
          _count: true
        }),
        prisma.medicine.findMany({
          where: { sellerId, stock: { lte: LOW_STOCK_THRESHOLD } },
          orderBy: { stock: "asc" },
          take: 5,
          select: { id: true, name: true, stock: true, price: true, category: { select: { name: true } } }
        }),
        prisma.order.findMany({
          where: { items: { some: { medicine: { sellerId } } } },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
            items: { select: { price: true, quantity: true, medicine: { select: { sellerId: true } } } }
          }
        })
      ]);
      let totalRevenue = 0, totalSold = 0;
      allOrders.forEach((o) => o.items.forEach((i) => {
        if (i.medicine.sellerId === sellerId) {
          totalRevenue += i.price * i.quantity;
          totalSold += i.quantity;
        }
      }));
      const completedOrders = ordersByStatusRaw.find((o) => o.status === "DELIVERED")?._count ?? 0;
      const cancelledOrders = ordersByStatusRaw.find((o) => o.status === "CANCELLED")?._count ?? 0;
      const totalOrders = allOrders.length;
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      let todayRevenue = 0, thisMonthRevenue = 0;
      allOrders.forEach((o) => {
        let orderRev = 0;
        o.items.forEach((i) => {
          if (i.medicine.sellerId === sellerId) orderRev += i.price * i.quantity;
        });
        if (o.createdAt >= monthStart) thisMonthRevenue += orderRev;
        if (o.createdAt >= todayStart) todayRevenue += orderRev;
      });
      return {
        medicines: {
          total: totalMedicines,
          outOfStock,
          lowStock,
          averagePrice: Number((avgPriceAgg._avg.price ?? 0).toFixed(2)),
          totalStock: avgPriceAgg._sum.stock ?? 0
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          byStatus: ordersByStatusRaw.map((o) => ({ status: o.status, count: o._count }))
        },
        revenue: {
          total: Number(totalRevenue.toFixed(2)),
          thisMonth: Number(thisMonthRevenue.toFixed(2)),
          today: Number(todayRevenue.toFixed(2)),
          averageOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0
        },
        sales: { totalSold },
        lowStockAlerts: lowStockMeds,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          status: o.status,
          createdAt: o.createdAt,
          customer: o.user?.name ?? "Unknown",
          total: o.items.filter((i) => i.medicine.sellerId === sellerId).reduce((s, i) => s + i.price * i.quantity, 0)
        }))
      };
    };
    getCustomerDashboardService = async (userId) => {
      const [orders, wishlistItemCount, wallet, prescriptions] = await Promise.all([
        prisma.order.findMany({
          where: { userId },
          include: { items: { select: { price: true, quantity: true, medicine: { select: { name: true, image: true } } } } },
          orderBy: { createdAt: "desc" }
        }),
        prisma.wishlistItem.count({
          where: { wishlist: { userId } }
        }),
        prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
        prisma.prescription.count({ where: { userId } })
      ]);
      const totalOrders = orders.length;
      const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
      const activeCount = orders.filter((o) => ["PLACED", "PROCESSING", "SHIPPED", "CONFIRMED"].includes(o.status)).length;
      const totalSpent = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
      const recentOrders = orders.slice(0, 5).map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        total: o.items.reduce((s, i) => s + i.price * i.quantity, 0),
        itemCount: o.items.length
      }));
      return {
        orders: { total: totalOrders, delivered: deliveredCount, active: activeCount },
        spending: { total: Number(totalSpent.toFixed(2)) },
        wallet: { balance: Number((wallet?.balance ?? 0).toFixed(2)) },
        wishlist: { count: wishlistItemCount },
        prescriptions: { total: prescriptions },
        recentOrders
      };
    };
    dashboardService = {
      getAdminDashboardService,
      getSellerDashboardService,
      getCustomerDashboardService
    };
  }
});

// src/module/dashboard/dashboard.controller.ts
var getDashboardStats, dashboardController;
var init_dashboard_controller = __esm({
  "src/module/dashboard/dashboard.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_dashboard_service();
    getDashboardStats = catchAsync(async (req, res) => {
      const user = req.user;
      if (!user?.id || !user?.role) {
        return sendResponse(res, {
          status: 401,
          success: false,
          message: "Unauthorized \u2014 please log in"
        });
      }
      let data;
      if (user.role === "ADMIN") {
        data = await dashboardService.getAdminDashboardService();
      } else if (user.role === "SELLER") {
        data = await dashboardService.getSellerDashboardService(user.id);
      } else {
        data = await dashboardService.getCustomerDashboardService(user.id);
      }
      return sendResponse(res, {
        status: 200,
        success: true,
        message: `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} dashboard stats fetched successfully`,
        data
      });
    });
    dashboardController = { getDashboardStats };
  }
});

// src/module/dashboard/dashboard.route.ts
import { Router as Router27 } from "express";
var router27, dashboardRouter;
var init_dashboard_route = __esm({
  "src/module/dashboard/dashboard.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_dashboard_controller();
    router27 = Router27();
    router27.get("/", auth_middleware_default(["ADMIN", "SELLER", "CUSTOMER"]), dashboardController.getDashboardStats);
    dashboardRouter = router27;
  }
});

// src/module/chatbot/chatbot.service.ts
async function buildAdminContext(userId) {
  const [users, orders, medicines, pendingLicenses, unreadMessages] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.medicine.count(),
    prisma.sellerLicense.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { status: "UNREAD" } })
  ]);
  const revenue = await prisma.orderItem.aggregate({ _sum: { price: true } });
  return `
LIVE ADMIN DATA:
- Total registered users: ${users}
- Total orders on platform: ${orders}
- Total medicines listed: ${medicines}
- Platform revenue (GMV): $${(revenue._sum.price ?? 0).toFixed(2)}
- Seller licenses pending review: ${pendingLicenses}
- Unread contact messages: ${unreadMessages}
`.trim();
}
async function buildSellerContext(userId) {
  const [medicines, orders, lowStock, outOfStock] = await Promise.all([
    prisma.medicine.count({ where: { sellerId: userId } }),
    prisma.order.count({ where: { items: { some: { medicine: { sellerId: userId } } } } }),
    prisma.medicine.count({ where: { sellerId: userId, stock: { gt: 0, lte: 10 } } }),
    prisma.medicine.count({ where: { sellerId: userId, stock: 0 } })
  ]);
  const revenueAgg = await prisma.orderItem.findMany({
    where: { medicine: { sellerId: userId } },
    select: { price: true, quantity: true }
  });
  const revenue = revenueAgg.reduce((s, i) => s + i.price * i.quantity, 0);
  const license = await prisma.sellerLicense.findUnique({
    where: { sellerId: userId },
    select: { status: true }
  });
  return `
LIVE SELLER DATA:
- Medicines listed: ${medicines}
- Total orders received: ${orders}
- Total revenue earned: $${revenue.toFixed(2)}
- Low stock items (\u226410 units): ${lowStock}
- Out-of-stock items: ${outOfStock}
- License status: ${license?.status ?? "Not submitted"}
`.trim();
}
async function buildCustomerContext(userId) {
  const [totalOrders, activeOrders, wishlistItems, wallet, prescriptions] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.count({ where: { userId, status: { in: ["PLACED", "PROCESSING", "SHIPPED"] } } }),
    prisma.wishlistItem.count({ where: { wishlist: { userId } } }),
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.prescription.count({ where: { userId } })
  ]);
  const spendAgg = await prisma.orderItem.findMany({
    where: { order: { userId } },
    select: { price: true, quantity: true }
  });
  const totalSpent = spendAgg.reduce((s, i) => s + i.price * i.quantity, 0);
  return `
LIVE CUSTOMER DATA:
- Total orders placed: ${totalOrders}
- Active (in-progress) orders: ${activeOrders}
- Total lifetime spend: $${totalSpent.toFixed(2)}
- Wallet balance: $${(wallet?.balance ?? 0).toFixed(2)}
- Wishlist items saved: ${wishlistItems}
- Prescriptions uploaded: ${prescriptions}
`.trim();
}
function getSystemPrompt(role, userName, context) {
  const base = `You are LifeLineBot, a professional and friendly AI assistant for LifeLine Healthcare Platform.
The logged-in user is: ${userName}, Role: ${role}

Live account data for this user:
${context}

${PLATFORM_KNOWLEDGE}

General instructions:
- For live data questions (my orders, my wallet, my medicines, etc.) answer from the user's live data above.
- For platform/feature questions, answer from the KNOWLEDGE BASE above.
- Never fabricate or invent data not provided above.
- Be professional, warm, and concise. Keep responses under 150 words unless more detail is needed.
- Use bullet points for lists of steps or features.
- Always recommend consulting a licensed doctor or pharmacist for medical advice.
- IMPORTANT \u2014 Actionable links: whenever you reference a page or action, include it as a markdown link using the format [Button Label](/path). Examples:
  - [Go to Dashboard](/dashboard)
  - [My Orders](/dashboard/customer/orders)
  - [Browse Medicines](/medicines)
  - [My Wallet](/dashboard/customer/wallet)
  Never write bare paths \u2014 always wrap in markdown link format.
- If you don't know something, say: "I don't have that information right now."`;
  if (role === "ADMIN") {
    return `${base}

Admin-specific instructions:
- Focus on platform-wide statistics, user management, seller compliance, and system health.
- When asked about users, show total counts from live data and link to [User Management](/dashboard/admin/users).
- When asked about pending actions, highlight pending licenses and link to [License Review](/dashboard/admin/license).
- When asked about revenue, show GMV from live data.
- When asked about contact messages, show unread count and link to [Messages](/dashboard/admin/messages).
- Provide proactive insights: "You have X pending licenses to review" etc.`;
  }
  if (role === "SELLER") {
    return `${base}

Seller-specific instructions:
- Focus on inventory, orders, revenue, and compliance.
- When asked about medicines, show listed count and link to [My Medicines](/dashboard/seller/medicines).
- When asked about stock, highlight low/out-of-stock items and link to [Stock Alerts](/dashboard/seller/stock-alerts).
- When asked about orders, show order count and link to [My Orders](/dashboard/seller/orders).
- When asked about revenue, show total from live data.
- When asked about license, show current status and link to [License](/dashboard/seller/license).`;
  }
  if (role === "CUSTOMER") {
    return `${base}

Customer-specific instructions:
- Focus on orders, health, wallet, and shopping.
- When asked about orders, show counts and link to [My Orders](/dashboard/customer/orders).
- When asked about wallet/balance, show live balance and link to [My Wallet](/dashboard/customer/wallet).
- When asked about wishlist, show item count and link to [Wishlist](/dashboard/customer/wishlist).
- When asked about prescriptions, show upload count and link to [Prescriptions](/dashboard/customer/prescription).
- When asked about tracking, link to [Order Tracking](/dashboard/customer/tracking).
- Proactively mention active orders if relevant.`;
  }
  return base;
}
var OPENROUTER_URL, MODEL, PLATFORM_KNOWLEDGE, chatWithAI, guestChat, chatbotService;
var init_chatbot_service = __esm({
  "src/module/chatbot/chatbot.service.ts"() {
    "use strict";
    init_prisma();
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    MODEL = "google/gemma-3-4b-it:free";
    PLATFORM_KNOWLEDGE = `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
LIFELINE HEALTHCARE PLATFORM \u2014 COMPLETE KNOWLEDGE BASE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

## WHAT IS LIFELINE?
LifeLine (also known as MediStore) is a modern online pharmacy platform connecting customers with 
verified sellers (licensed pharmacies) \u2014 making quality healthcare accessible and affordable.
- Customers browse, order, and track medicines online.
- Sellers list medicines, manage inventory, and fulfill orders.
- Admins oversee the entire platform \u2014 users, compliance, content, and commerce.

## PRODUCTS & SERVICES
- Over-the-counter (OTC) medicines \u2014 no prescription needed
- Prescription medicines \u2014 customer must upload a valid prescription before checkout
- Health supplements, vitamins & minerals
- Medical devices & personal care products
- Categories: Antibiotics, Cardiovascular, Diabetes, Gastroenterology, Respiratory, Vitamins & Supplements, Dermatology, Pediatrics

## DELIVERY POLICY
- Standard Delivery: 3\u20135 business days \u2014 $2.99 flat fee
- Express Delivery: 1\u20132 business days \u2014 $5.99 flat fee
- FREE delivery on all orders of $50 and above
- Nationwide delivery coverage; real-time order tracking available

## PAYMENT OPTIONS
- LifeLine Wallet (platform credit \u2014 topped up via card or bank transfer)
- Credit / Debit card (Stripe-powered, secure checkout)
- Online banking transfer

## RETURNS & REFUNDS
- 7-day return window from delivery date (unopened and undamaged products only)
- Damaged or incorrect items: full refund guaranteed, no questions asked
- Prescription medicines and opened products: non-returnable for safety reasons
- Refunds are credited to LifeLine Wallet within 3\u20135 business days

## SELLER INFORMATION
- Licensed pharmacies and healthcare businesses can register as sellers
- Pharmacy license verification is mandatory before listing any products
- Sellers manage their own inventory, pricing, and order fulfillment
- Flash sales and custom coupon campaigns available
- License status is reviewed by admin within 2\u20133 business days

## CUSTOMER FEATURES
- Prescription upload for Rx-only medicines
- Real-time order tracking with live status updates
- Auto-refill subscription service (weekly / bi-weekly / monthly)
- Wishlist to save favourite products
- LifeLine Wallet with full transaction history
- Coupon & discount code support
- Flash sale events with limited-time pricing
- Returns & refund requests through the dashboard

## PAGES & NAVIGATION
- Home: [/]
- Browse medicines: [/medicines]
- Login: [/login]
- Register: [/register]
- Dashboard: [/dashboard]
- My Orders: [/dashboard/customer/orders]
- My Wallet: [/dashboard/customer/wallet]
- Prescriptions: [/dashboard/customer/prescription]
- Wishlist: [/dashboard/customer/wishlist]
- Order Tracking: [/dashboard/customer/tracking]
- Seller dashboard: [/dashboard/seller]
- Seller medicines: [/dashboard/seller/medicines]
- Admin dashboard: [/dashboard/admin]
`.trim();
    chatWithAI = async (userId, role, userName, message, history) => {
      const key = process.env.OPENROUTER_API_KEY ?? "";
      if (!key) {
        throw new Error("AI service is not yet configured. Please add a valid OPENROUTER_API_KEY to the backend .env file.");
      }
      let rawContext = "";
      try {
        if (role === "ADMIN") rawContext = await buildAdminContext(userId);
        else if (role === "SELLER") rawContext = await buildSellerContext(userId);
        else rawContext = await buildCustomerContext(userId);
      } catch {
        rawContext = `Authenticated ${role} user (live data temporarily unavailable).`;
      }
      const context = rawContext.length > 3e3 ? rawContext.slice(0, 3e3) + "\n...(truncated)" : rawContext;
      const systemContent = getSystemPrompt(role, userName, context);
      const trimmedHistory = history.slice(-6);
      const fullPrompt = `${systemContent}

Conversation so far:
${trimmedHistory.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}

User: ${message}
Assistant:`;
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.frontendBaseUrl ?? "http://localhost:3000",
          "X-Title": "LifeLine Chatbot"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: fullPrompt }]
        })
      });
      if (!response.ok) {
        const err = await response.json();
        console.error("OpenRouter error:", JSON.stringify(err, null, 2));
        throw new Error(`AI service error (${response.status})`);
      }
      const result = await response.json();
      return result.choices[0].message.content.trim();
    };
    guestChat = async (message, history) => {
      const key = process.env.OPENROUTER_API_KEY ?? "";
      if (!key) {
        throw new Error("AI service is not yet configured. Please add a valid OPENROUTER_API_KEY to the backend .env file.");
      }
      const trimmedHistory = history.slice(-4);
      const fullPrompt = `You are LifeLineBot, a professional and friendly AI assistant for LifeLine Healthcare Platform. You are talking to a guest (not logged in).

${PLATFORM_KNOWLEDGE}

Guest instructions:
- Answer ONLY based on the knowledge above. Never fabricate data.
- Be concise, warm, and professional. Keep responses under 120 words.
- Use bullet points for lists of steps or features.
- If they ask for personal data (their orders, wallet, etc.), tell them to log in first and include [Login](/login).
- After answering, include one relevant actionable link (sign up, browse medicines, login, etc.).
- IMPORTANT \u2014 Actionable links: use markdown format [Button Label](/path). Examples:
  - [Sign Up Free](/register)
  - [Login](/login)
  - [Browse Medicines](/medicines)
  - [Learn More](/)
- If you don't know something, say: "I don't have that information right now."

Conversation so far:
${trimmedHistory.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}

User: ${message}
Assistant:`;
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.frontendBaseUrl ?? "http://localhost:3000",
          "X-Title": "LifeLine Chatbot"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: fullPrompt }]
        })
      });
      if (!response.ok) {
        const err = await response.json();
        console.error("OpenRouter error:", JSON.stringify(err, null, 2));
        throw new Error(`AI service error (${response.status})`);
      }
      const result = await response.json();
      return result.choices[0].message.content.trim();
    };
    chatbotService = { chatWithAI, guestChat };
  }
});

// src/module/chatbot/chatbot.controller.ts
var GUEST_LIMIT, chat, chatbotController;
var init_chatbot_controller = __esm({
  "src/module/chatbot/chatbot.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_auth();
    init_chatbot_service();
    GUEST_LIMIT = 4;
    chat = catchAsync(async (req, res) => {
      let userId;
      let userRole;
      let userName;
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (session?.user) {
          userId = session.user.id;
          userRole = session.user.role ?? "CUSTOMER";
          userName = session.user.name;
        }
      } catch {
      }
      const isGuest = !userId;
      const { messages, guestCount } = req.body;
      if (isGuest && typeof guestCount === "number" && guestCount >= GUEST_LIMIT) {
        return sendResponse(res, {
          status: 403,
          success: false,
          message: `Guest chat limit of ${GUEST_LIMIT} messages reached. Please sign in for unlimited access.`
        });
      }
      if (!Array.isArray(messages) || messages.length === 0) {
        return sendResponse(res, {
          status: 400,
          success: false,
          message: "messages array is required and must not be empty."
        });
      }
      const sanitised = messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-20);
      const lastMsg = sanitised.at(-1);
      if (!lastMsg) {
        return sendResponse(res, { status: 400, success: false, message: "No messages provided." });
      }
      if (lastMsg.role !== "user") {
        return sendResponse(res, {
          status: 400,
          success: false,
          message: "Last message must be from the user."
        });
      }
      const currentMessage = lastMsg.content;
      const history = sanitised.slice(0, -1);
      let content;
      if (isGuest) {
        content = await chatbotService.guestChat(currentMessage, history);
      } else {
        content = await chatbotService.chatWithAI(
          userId,
          userRole,
          userName,
          currentMessage,
          history
        );
      }
      return sendResponse(res, {
        status: 200,
        success: true,
        message: "Chat response generated",
        data: {
          content,
          isGuest,
          role: userRole ?? null
        }
      });
    });
    chatbotController = { chat };
  }
});

// src/module/chatbot/chatbot.route.ts
import { Router as Router28 } from "express";
var router28, chatbotRouter;
var init_chatbot_route = __esm({
  "src/module/chatbot/chatbot.route.ts"() {
    "use strict";
    init_chatbot_controller();
    router28 = Router28();
    router28.post("/chat", chatbotController.chat);
    chatbotRouter = router28;
  }
});

// src/module/warehouse/warehouse.service.ts
import status34 from "http-status";
var haversine, createWarehouse, listWarehouses, getWarehouse, updateWarehouse, deleteWarehouse, getNearestWarehouses, addLocation, listLocations, submitLocationRequest, listLocationRequests, reviewLocationRequest, getMyWarehouse, getInboundOrders, warehouseService;
var init_warehouse_service = __esm({
  "src/module/warehouse/warehouse.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    createWarehouse = async (data) => {
      return prisma.$transaction(async (tx) => {
        const manager = await tx.user.findUnique({ where: { id: data.managerId } });
        if (!manager) throw new AppError_default(status34.NOT_FOUND, "Manager user not found");
        const warehouse = await tx.warehouse.create({
          data,
          include: { manager: { select: { id: true, name: true, email: true, role: true } } }
        });
        if (manager.role !== "ADMIN") {
          await tx.user.update({
            where: { id: data.managerId },
            data: { role: "WAREHOUSE" }
          });
        }
        return warehouse;
      });
    };
    listWarehouses = (showAll = false) => prisma.warehouse.findMany({
      ...showAll ? {} : { where: { isActive: true } },
      include: { manager: { select: { id: true, name: true, email: true } }, _count: { select: { locationStocks: true, fulfillmentTasks: true } } },
      orderBy: { name: "asc" }
    });
    getWarehouse = async (id) => {
      const w = await prisma.warehouse.findUnique({
        where: { id },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          locations: true,
          locationStocks: { include: { medicine: { select: { id: true, name: true, price: true, image: true } } } },
          storageBins: { include: { location: true } }
        }
      });
      if (!w) throw new AppError_default(status34.NOT_FOUND, "Warehouse not found");
      return w;
    };
    updateWarehouse = async (id, data) => {
      const w = await prisma.warehouse.findUnique({ where: { id } });
      if (!w) throw new AppError_default(status34.NOT_FOUND, "Warehouse not found");
      return prisma.warehouse.update({ where: { id }, data });
    };
    deleteWarehouse = async (id) => {
      return prisma.$transaction(async (tx) => {
        const warehouse = await tx.warehouse.findUnique({
          where: { id },
          select: { managerId: true }
        });
        if (!warehouse) throw new AppError_default(status34.NOT_FOUND, "Warehouse not found");
        await tx.warehouse.delete({ where: { id } });
        const manager = await tx.user.findUnique({ where: { id: warehouse.managerId } });
        if (manager && manager.role === "WAREHOUSE") {
          await tx.user.update({
            where: { id: warehouse.managerId },
            data: { role: "CUSTOMER" }
          });
        }
      });
    };
    getNearestWarehouses = async (lat, lng) => {
      const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } });
      return warehouses.map((w) => ({ ...w, distanceKm: parseFloat(haversine(lat, lng, w.lat, w.lng).toFixed(2)) })).sort((a, b) => a.distanceKm - b.distanceKm);
    };
    addLocation = (data) => prisma.warehouseLocation.create({ data });
    listLocations = (warehouseId) => prisma.warehouseLocation.findMany({ where: { warehouseId }, include: { bins: true } });
    submitLocationRequest = async (warehouseId, requestedById, data) => {
      const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!wh) throw new AppError_default(status34.NOT_FOUND, "Warehouse not found");
      await prisma.warehouseLocationRequest.updateMany({
        where: { warehouseId, status: "PENDING" },
        data: { status: "REJECTED", adminNote: "Superseded by a newer request" }
      });
      return prisma.warehouseLocationRequest.create({
        data: { warehouseId, requestedById, ...data },
        include: { warehouse: { select: { name: true } }, requestedBy: { select: { name: true } } }
      });
    };
    listLocationRequests = (filterStatus) => prisma.warehouseLocationRequest.findMany({
      ...filterStatus ? { where: { status: filterStatus } } : {},
      include: {
        warehouse: { select: { id: true, name: true, city: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    reviewLocationRequest = async (reqId, reviewerId, action, adminNote) => {
      const req = await prisma.warehouseLocationRequest.findUnique({
        where: { id: reqId }
      });
      if (!req) throw new AppError_default(status34.NOT_FOUND, "Request not found");
      if (req.status !== "PENDING") throw new AppError_default(status34.BAD_REQUEST, "Request already reviewed");
      return prisma.$transaction(async (tx) => {
        const updated = await tx.warehouseLocationRequest.update({
          where: { id: reqId },
          data: {
            status: action,
            reviewedById: reviewerId,
            ...adminNote !== void 0 ? { adminNote } : {}
          }
        });
        if (action === "APPROVED") {
          const patch = {};
          if (req.address) patch.address = req.address;
          if (req.city) patch.city = req.city;
          if (req.lat) patch.lat = req.lat;
          if (req.lng) patch.lng = req.lng;
          if (req.phone) patch.phone = req.phone;
          if (Object.keys(patch).length > 0) {
            await tx.warehouse.update({ where: { id: req.warehouseId }, data: patch });
          }
        }
        return updated;
      });
    };
    getMyWarehouse = async (userId) => {
      const wh = await prisma.warehouse.findFirst({
        where: { managerId: userId },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          locationStocks: {
            include: {
              medicine: { select: { id: true, name: true, price: true, image: true, stock: true, genericName: true } }
            },
            orderBy: { medicine: { name: "asc" } }
          },
          _count: { select: { locationStocks: true, fulfillmentTasks: true } }
        }
      });
      if (!wh) throw new AppError_default(status34.NOT_FOUND, "No warehouse found for this manager");
      return wh;
    };
    getInboundOrders = (warehouseId) => prisma.shipmentLeg.findMany({
      where: { destWarehouseId: warehouseId },
      include: {
        subOrder: {
          include: {
            seller: { select: { id: true, name: true, email: true, businessCity: true } },
            items: {
              include: {
                medicine: { select: { id: true, name: true, price: true, image: true } }
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            address: true,
            createdAt: true,
            status: true,
            user: { select: { name: true, email: true } }
          }
        },
        originWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } },
        destWarehouse: { select: { id: true, name: true, city: true, address: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    warehouseService = {
      createWarehouse,
      listWarehouses,
      getWarehouse,
      updateWarehouse,
      deleteWarehouse,
      getNearestWarehouses,
      addLocation,
      listLocations,
      submitLocationRequest,
      listLocationRequests,
      reviewLocationRequest,
      getMyWarehouse,
      getInboundOrders
    };
  }
});

// src/module/warehouse/warehouse.controller.ts
import status35 from "http-status";
var createWarehouse2, listWarehouses2, getWarehouse2, updateWarehouse2, getNearestWarehouses2, addLocation2, listLocations2, deleteWarehouse2, submitLocationRequest2, listLocationRequests2, reviewLocationRequest2, getMyWarehouse2, getInboundOrders2, warehouseController;
var init_warehouse_controller = __esm({
  "src/module/warehouse/warehouse.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_warehouse_service();
    createWarehouse2 = catchAsync(async (req, res) => {
      const data = await warehouseService.createWarehouse(req.body);
      sendResponse(res, { status: status35.CREATED, success: true, message: "Warehouse created", data });
    });
    listWarehouses2 = catchAsync(async (req, res) => {
      const showAll = req.user?.role === "ADMIN";
      const data = await warehouseService.listWarehouses(showAll);
      sendResponse(res, { status: status35.OK, success: true, message: "Warehouses fetched", data });
    });
    getWarehouse2 = catchAsync(async (req, res) => {
      const data = await warehouseService.getWarehouse(req.params.id);
      sendResponse(res, { status: status35.OK, success: true, message: "Warehouse fetched", data });
    });
    updateWarehouse2 = catchAsync(async (req, res) => {
      const data = await warehouseService.updateWarehouse(req.params.id, req.body);
      sendResponse(res, { status: status35.OK, success: true, message: "Warehouse updated", data });
    });
    getNearestWarehouses2 = catchAsync(async (req, res) => {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ success: false, message: "lat and lng query params are required" });
      }
      const data = await warehouseService.getNearestWarehouses(lat, lng);
      sendResponse(res, { status: status35.OK, success: true, message: "Nearest warehouses", data });
    });
    addLocation2 = catchAsync(async (req, res) => {
      const data = await warehouseService.addLocation(req.body);
      sendResponse(res, { status: status35.CREATED, success: true, message: "Location added", data });
    });
    listLocations2 = catchAsync(async (req, res) => {
      const data = await warehouseService.listLocations(req.params.warehouseId);
      sendResponse(res, { status: status35.OK, success: true, message: "Locations fetched", data });
    });
    deleteWarehouse2 = catchAsync(async (req, res) => {
      await warehouseService.deleteWarehouse(req.params.id);
      sendResponse(res, { status: status35.OK, success: true, message: "Warehouse deleted and manager role reverted to CUSTOMER", data: null });
    });
    submitLocationRequest2 = catchAsync(async (req, res) => {
      const data = await warehouseService.submitLocationRequest(
        req.params.id,
        req.user.id,
        req.body
      );
      sendResponse(res, { status: status35.CREATED, success: true, message: "Location change request submitted. Awaiting admin approval.", data });
    });
    listLocationRequests2 = catchAsync(async (req, res) => {
      const filterStatus = req.query.status;
      const data = await warehouseService.listLocationRequests(filterStatus);
      sendResponse(res, { status: status35.OK, success: true, message: "Location requests fetched", data });
    });
    reviewLocationRequest2 = catchAsync(async (req, res) => {
      const { action, adminNote } = req.body;
      if (!["APPROVED", "REJECTED"].includes(action))
        return res.status(400).json({ success: false, message: "action must be APPROVED or REJECTED" });
      const data = await warehouseService.reviewLocationRequest(
        req.params.reqId,
        req.user.id,
        action,
        adminNote
      );
      sendResponse(res, { status: status35.OK, success: true, message: `Request ${action.toLowerCase()}`, data });
    });
    getMyWarehouse2 = catchAsync(async (req, res) => {
      const data = await warehouseService.getMyWarehouse(req.user.id);
      sendResponse(res, { status: status35.OK, success: true, message: "Your warehouse fetched", data });
    });
    getInboundOrders2 = catchAsync(async (req, res) => {
      const data = await warehouseService.getInboundOrders(req.params.warehouseId);
      sendResponse(res, { status: status35.OK, success: true, message: "Inbound orders fetched", data });
    });
    warehouseController = {
      createWarehouse: createWarehouse2,
      listWarehouses: listWarehouses2,
      getWarehouse: getWarehouse2,
      updateWarehouse: updateWarehouse2,
      deleteWarehouse: deleteWarehouse2,
      getNearestWarehouses: getNearestWarehouses2,
      addLocation: addLocation2,
      listLocations: listLocations2,
      submitLocationRequest: submitLocationRequest2,
      listLocationRequests: listLocationRequests2,
      reviewLocationRequest: reviewLocationRequest2,
      getMyWarehouse: getMyWarehouse2,
      getInboundOrders: getInboundOrders2
    };
  }
});

// src/module/warehouse/locationStock.service.ts
import status36 from "http-status";
var getStock, adjustStock, setStock, locationStockService;
var init_locationStock_service = __esm({
  "src/module/warehouse/locationStock.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    getStock = (warehouseId) => prisma.locationStock.findMany({
      where: { warehouseId },
      include: { medicine: { select: { id: true, name: true, price: true, image: true, stock: true } } },
      orderBy: { medicine: { name: "asc" } }
    });
    adjustStock = async (warehouseId, medicineId, delta) => {
      const existing = await prisma.locationStock.findUnique({
        where: { warehouseId_medicineId: { warehouseId, medicineId } }
      });
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty < 0) throw new AppError_default(status36.BAD_REQUEST, "Insufficient warehouse stock");
        return prisma.locationStock.update({
          where: { warehouseId_medicineId: { warehouseId, medicineId } },
          data: { quantity: newQty }
        });
      }
      if (delta < 0) throw new AppError_default(status36.BAD_REQUEST, "No stock record found");
      return prisma.locationStock.create({ data: { warehouseId, medicineId, quantity: delta } });
    };
    setStock = (warehouseId, medicineId, quantity) => prisma.locationStock.upsert({
      where: { warehouseId_medicineId: { warehouseId, medicineId } },
      update: { quantity },
      create: { warehouseId, medicineId, quantity }
    });
    locationStockService = { getStock, adjustStock, setStock };
  }
});

// src/module/warehouse/warehouse.route.ts
import { Router as Router29 } from "express";
import status37 from "http-status";
var router29, warehouseRouter;
var init_warehouse_route = __esm({
  "src/module/warehouse/warehouse.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_warehouse_controller();
    init_catchAsync();
    init_sendResponse();
    init_locationStock_service();
    router29 = Router29();
    router29.post("/", auth_middleware_default(["ADMIN"]), warehouseController.createWarehouse);
    router29.get("/my", auth_middleware_default(["WAREHOUSE", "ADMIN"]), warehouseController.getMyWarehouse);
    router29.get("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), warehouseController.listWarehouses);
    router29.get("/nearest", warehouseController.getNearestWarehouses);
    router29.get("/:id", auth_middleware_default(["ADMIN", "WAREHOUSE"]), warehouseController.getWarehouse);
    router29.patch("/:id", auth_middleware_default(["ADMIN"]), warehouseController.updateWarehouse);
    router29.delete("/:id", auth_middleware_default(["ADMIN"]), warehouseController.deleteWarehouse);
    router29.post("/:id/location-request", auth_middleware_default(["WAREHOUSE"]), warehouseController.submitLocationRequest);
    router29.get("/location-requests/all", auth_middleware_default(["ADMIN"]), warehouseController.listLocationRequests);
    router29.patch("/location-requests/:reqId/review", auth_middleware_default(["ADMIN"]), warehouseController.reviewLocationRequest);
    router29.post("/locations/add", auth_middleware_default(["ADMIN", "WAREHOUSE"]), warehouseController.addLocation);
    router29.get("/:warehouseId/locations", auth_middleware_default(["ADMIN", "WAREHOUSE"]), warehouseController.listLocations);
    router29.get("/:warehouseId/inbound-orders", auth_middleware_default(["ADMIN", "WAREHOUSE"]), warehouseController.getInboundOrders);
    router29.get(
      "/:warehouseId/stock",
      auth_middleware_default(["ADMIN", "WAREHOUSE"]),
      catchAsync(async (req, res) => {
        const data = await locationStockService.getStock(req.params.warehouseId);
        sendResponse(res, { status: status37.OK, success: true, message: "Stock fetched", data });
      })
    );
    router29.post(
      "/stock/adjust",
      auth_middleware_default(["ADMIN", "WAREHOUSE"]),
      catchAsync(async (req, res) => {
        const { warehouseId, medicineId, delta } = req.body;
        const data = await locationStockService.adjustStock(warehouseId, medicineId, delta);
        sendResponse(res, { status: status37.OK, success: true, message: "Stock adjusted", data });
      })
    );
    warehouseRouter = router29;
  }
});

// src/module/stockTransfer/stockTransfer.service.ts
import status38 from "http-status";
var createTransfer, listTransfers, approveTransfer, completeTransfer, cancelTransfer, stockTransferService;
var init_stockTransfer_service = __esm({
  "src/module/stockTransfer/stockTransfer.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    init_locationStock_service();
    createTransfer = async (data) => {
      const { items, ...transferData } = data;
      return prisma.stockTransfer.create({
        data: {
          ...transferData,
          items: { create: items }
        },
        include: { items: { include: { medicine: { select: { id: true, name: true } } } } }
      });
    };
    listTransfers = (warehouseId) => prisma.stockTransfer.findMany({
      where: warehouseId ? { OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }] } : {},
      include: {
        fromWarehouse: { select: { id: true, name: true, city: true } },
        toWarehouse: { select: { id: true, name: true, city: true } },
        requestedBy: { select: { id: true, name: true } },
        items: { include: { medicine: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });
    approveTransfer = async (id) => {
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!transfer) throw new AppError_default(status38.NOT_FOUND, "Transfer not found");
      if (transfer.status !== "PENDING") throw new AppError_default(status38.BAD_REQUEST, "Transfer is not PENDING");
      for (const item of transfer.items) {
        const src = await prisma.locationStock.findUnique({
          where: { warehouseId_medicineId: { warehouseId: transfer.fromWarehouseId, medicineId: item.medicineId } }
        });
        if (!src || src.quantity < item.quantity) {
          throw new AppError_default(status38.BAD_REQUEST, `Insufficient stock for medicine ${item.medicineId} in source warehouse`);
        }
      }
      return prisma.stockTransfer.update({ where: { id }, data: { status: "IN_TRANSIT" } });
    };
    completeTransfer = async (id) => {
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!transfer) throw new AppError_default(status38.NOT_FOUND, "Transfer not found");
      if (transfer.status !== "IN_TRANSIT") throw new AppError_default(status38.BAD_REQUEST, "Transfer must be IN_TRANSIT");
      await Promise.all(transfer.items.map(async (item) => {
        await locationStockService.adjustStock(transfer.fromWarehouseId, item.medicineId, -item.quantity);
        await locationStockService.adjustStock(transfer.toWarehouseId, item.medicineId, item.quantity);
      }));
      return prisma.stockTransfer.update({ where: { id }, data: { status: "COMPLETED" } });
    };
    cancelTransfer = async (id) => {
      const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
      if (!transfer) throw new AppError_default(status38.NOT_FOUND, "Transfer not found");
      if (transfer.status === "COMPLETED") throw new AppError_default(status38.BAD_REQUEST, "Cannot cancel a completed transfer");
      return prisma.stockTransfer.update({ where: { id }, data: { status: "CANCELLED" } });
    };
    stockTransferService = { createTransfer, listTransfers, approveTransfer, completeTransfer, cancelTransfer };
  }
});

// src/module/stockTransfer/stockTransfer.route.ts
import { Router as Router30 } from "express";
import status39 from "http-status";
var router30, stockTransferRouter;
var init_stockTransfer_route = __esm({
  "src/module/stockTransfer/stockTransfer.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_stockTransfer_service();
    router30 = Router30();
    router30.post("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await stockTransferService.createTransfer({ ...req.body, requestedById: req.user.id });
      sendResponse(res, { status: status39.CREATED, success: true, message: "Transfer created", data });
    }));
    router30.get("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const warehouseId = req.query.warehouseId;
      const data = await stockTransferService.listTransfers(warehouseId);
      sendResponse(res, { status: status39.OK, success: true, message: "Transfers fetched", data });
    }));
    router30.patch("/:id/approve", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const data = await stockTransferService.approveTransfer(req.params.id);
      sendResponse(res, { status: status39.OK, success: true, message: "Transfer approved (IN_TRANSIT)", data });
    }));
    router30.patch("/:id/complete", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await stockTransferService.completeTransfer(req.params.id);
      sendResponse(res, { status: status39.OK, success: true, message: "Transfer completed \u2014 stock moved", data });
    }));
    router30.patch("/:id/cancel", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const data = await stockTransferService.cancelTransfer(req.params.id);
      sendResponse(res, { status: status39.OK, success: true, message: "Transfer cancelled", data });
    }));
    stockTransferRouter = router30;
  }
});

// src/module/grn/grn.service.ts
import status40 from "http-status";
var createGRN, listGRNs, getGRN, verifyGRN, grnService;
var init_grn_service = __esm({
  "src/module/grn/grn.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    init_locationStock_service();
    createGRN = (data) => {
      const { items, ...grnData } = data;
      return prisma.goodsReceiptNote.create({
        data: {
          ...grnData,
          items: {
            create: items.map((i) => ({
              medicine: { connect: { id: i.medicineId } },
              expectedQty: i.expectedQty,
              receivedQty: i.receivedQty,
              ...i.batchNumber ? { batchNumber: i.batchNumber } : {},
              ...i.expiryDate ? { expiryDate: new Date(i.expiryDate) } : {}
            }))
          }
        },
        include: { items: { include: { medicine: { select: { id: true, name: true } } } }, supplier: true }
      });
    };
    listGRNs = (warehouseId) => prisma.goodsReceiptNote.findMany({
      where: warehouseId ? { warehouseId } : {},
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        receivedBy: { select: { id: true, name: true } },
        items: { include: { medicine: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });
    getGRN = async (id) => {
      const grn = await prisma.goodsReceiptNote.findUnique({
        where: { id },
        include: {
          supplier: true,
          warehouse: true,
          receivedBy: { select: { id: true, name: true } },
          items: { include: { medicine: true } }
        }
      });
      if (!grn) throw new AppError_default(status40.NOT_FOUND, "GRN not found");
      return grn;
    };
    verifyGRN = async (id) => {
      const grn = await prisma.goodsReceiptNote.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!grn) throw new AppError_default(status40.NOT_FOUND, "GRN not found");
      if (grn.status === "VERIFIED") throw new AppError_default(status40.BAD_REQUEST, "GRN already verified");
      const now = /* @__PURE__ */ new Date();
      await Promise.all(grn.items.map(async (item) => {
        await locationStockService.adjustStock(grn.warehouseId, item.medicineId, item.receivedQty);
        if (item.expiryDate) {
          const daysLeft = Math.floor((item.expiryDate.getTime() - now.getTime()) / 864e5);
          if (daysLeft <= 90) {
            const severity = daysLeft <= 7 ? "CRITICAL" : daysLeft <= 30 ? "HIGH" : daysLeft <= 60 ? "MEDIUM" : "LOW";
            await prisma.expiryAlert.create({
              data: {
                warehouseId: grn.warehouseId,
                medicineId: item.medicineId,
                batchNumber: item.batchNumber || "N/A",
                expiresAt: item.expiryDate,
                daysLeft,
                severity
              }
            });
          }
        }
      }));
      return prisma.goodsReceiptNote.update({ where: { id }, data: { status: "VERIFIED" } });
    };
    grnService = { createGRN, listGRNs, getGRN, verifyGRN };
  }
});

// src/module/grn/grn.route.ts
import { Router as Router31 } from "express";
import status41 from "http-status";
var router31, grnRouter;
var init_grn_route = __esm({
  "src/module/grn/grn.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_grn_service();
    router31 = Router31();
    router31.post("/", auth_middleware_default(["WAREHOUSE", "SELLER"]), catchAsync(async (req, res) => {
      const data = await grnService.createGRN({ ...req.body, receivedById: req.user.id });
      sendResponse(res, { status: status41.CREATED, success: true, message: "GRN created", data });
    }));
    router31.get("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await grnService.listGRNs(req.query.warehouseId);
      sendResponse(res, { status: status41.OK, success: true, message: "GRNs fetched", data });
    }));
    router31.get("/:id", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await grnService.getGRN(req.params.id);
      sendResponse(res, { status: status41.OK, success: true, message: "GRN fetched", data });
    }));
    router31.patch("/:id/verify", auth_middleware_default(["WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await grnService.verifyGRN(req.params.id);
      sendResponse(res, { status: status41.OK, success: true, message: "GRN verified \u2014 stock updated", data });
    }));
    grnRouter = router31;
  }
});

// src/module/fulfillment/fulfillment.service.ts
import status42 from "http-status";
var getQueue, getMyQueue, assignTask, receiveSellerItems, packTask, dispatchTask, markDelivered, getTask, fulfillmentService;
var init_fulfillment_service = __esm({
  "src/module/fulfillment/fulfillment.service.ts"() {
    "use strict";
    init_enums();
    init_prisma();
    init_AppError();
    getQueue = (warehouseId) => prisma.fulfillmentTask.findMany({
      where: { warehouseId },
      include: {
        order: {
          include: {
            items: { include: { medicine: { select: { id: true, name: true, image: true } } } },
            user: { select: { id: true, name: true, email: true } },
            subOrders: { include: { seller: { select: { id: true, name: true } } } },
            tracking: { orderBy: { createdAt: "asc" } }
          }
        },
        assignedTo: { select: { id: true, name: true } },
        packingSlip: true
      },
      orderBy: { createdAt: "asc" }
    });
    getMyQueue = async (_userId) => {
      const user = await prisma.user.findUnique({
        where: { id: _userId },
        select: { role: true }
      });
      if (!user) throw new AppError_default(status42.NOT_FOUND, "User not found");
      const where = {};
      if (user.role !== "ADMIN") {
        const managedWarehouses = await prisma.warehouse.findMany({
          where: { managerId: _userId },
          select: { id: true }
        });
        if (managedWarehouses.length === 0) return [];
        where.warehouseId = { in: managedWarehouses.map((w) => w.id) };
      }
      return prisma.fulfillmentTask.findMany({
        where,
        include: {
          order: {
            include: {
              items: { include: { medicine: { select: { id: true, name: true, image: true } } } },
              user: { select: { id: true, name: true, email: true } },
              subOrders: {
                include: {
                  seller: { select: { id: true, name: true } },
                  items: { select: { price: true, quantity: true } },
                  // ✅ Include stagedAt so UI can show per-seller staging progress
                  shipmentLeg: {
                    select: {
                      id: true,
                      status: true,
                      stagedAt: true,
                      arrivedAtDestAt: true,
                      originWarehouse: { select: { name: true, city: true } }
                    }
                  }
                }
              },
              tracking: { orderBy: { createdAt: "asc" } }
            }
          },
          warehouse: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          packingSlip: true
        },
        orderBy: { createdAt: "asc" }
      });
    };
    assignTask = async (orderId, warehouseId, assignedToId) => {
      const existing = await prisma.fulfillmentTask.findUnique({ where: { orderId } });
      if (existing) {
        if (!["PENDING", "READY"].includes(existing.status)) {
          throw new AppError_default(
            status42.BAD_REQUEST,
            `Cannot assign task: current status is ${existing.status}. Task must be PENDING or READY.`
          );
        }
        return prisma.fulfillmentTask.update({
          where: { orderId },
          data: { warehouseId, assignedToId, status: "PICKED", startedAt: /* @__PURE__ */ new Date() }
        });
      }
      return prisma.fulfillmentTask.create({
        data: { orderId, warehouseId, assignedToId, status: "PICKED", startedAt: /* @__PURE__ */ new Date() }
      });
    };
    receiveSellerItems = async (taskId, subOrderId, userId) => {
      const task = await prisma.fulfillmentTask.findUnique({
        where: { id: taskId },
        include: {
          order: { include: { subOrders: { select: { id: true } } } },
          packingSlip: true
        }
      });
      if (!task) throw new AppError_default(status42.NOT_FOUND, "Task not found");
      const leg = await prisma.shipmentLeg.findFirst({
        where: { subOrderId },
        orderBy: { createdAt: "desc" }
      });
      if (!leg) throw new AppError_default(status42.NOT_FOUND, "Shipment leg not found for this sub-order");
      if (leg.status !== "AT_DEST_WH") {
        throw new AppError_default(
          status42.BAD_REQUEST,
          `Cannot stage: package has not arrived at the destination warehouse yet (leg status: ${leg.status}). Complete the routing steps first.`
        );
      }
      await prisma.shipmentLeg.update({
        where: { id: leg.id },
        data: { stagedAt: /* @__PURE__ */ new Date() }
      });
      const currentData = task.packingSlip?.items ?? { receivedSubOrderIds: [] };
      const received = Array.isArray(currentData.receivedSubOrderIds) ? currentData.receivedSubOrderIds : [];
      if (!received.includes(subOrderId)) received.push(subOrderId);
      const newItems = { ...currentData, receivedSubOrderIds: received };
      const packedBy = task.assignedToId ?? userId;
      const slip = await prisma.packingSlip.upsert({
        where: { fulfillmentTaskId: taskId },
        update: { items: newItems },
        create: { fulfillmentTaskId: taskId, packedBy, items: newItems }
      });
      const allIds = task.order.subOrders.map((s) => s.id);
      const allReceived = allIds.every((id) => received.includes(id));
      if (allReceived) {
        await prisma.fulfillmentTask.update({
          where: { id: taskId },
          data: { status: "PICKED", assignedToId: userId, startedAt: task.startedAt ?? /* @__PURE__ */ new Date() }
        });
      } else if (["PENDING", "READY", "CONSOLIDATING"].includes(task.status)) {
        await prisma.fulfillmentTask.update({
          where: { id: taskId },
          data: { status: "CONSOLIDATING", assignedToId: userId, startedAt: task.startedAt ?? /* @__PURE__ */ new Date() }
        });
      }
      return {
        slip,
        receivedSubOrderIds: received,
        allReceived,
        receivedCount: received.length,
        totalCount: allIds.length
      };
    };
    packTask = async (taskId, packedBy, items) => {
      const task = await prisma.fulfillmentTask.findUnique({
        where: { id: taskId },
        include: { packingSlip: true }
      });
      if (!task) throw new AppError_default(status42.NOT_FOUND, "Task not found");
      if (task.status === "CONSOLIDATING") {
        throw new AppError_default(
          status42.BAD_REQUEST,
          "Cannot pack yet \u2014 waiting for remaining seller packages to be staged."
        );
      }
      if (!["PICKED", "READY"].includes(task.status)) {
        throw new AppError_default(
          status42.BAD_REQUEST,
          `Cannot pack task: current status is ${task.status}. Task must be PICKED or READY.`
        );
      }
      await prisma.fulfillmentTask.update({
        where: { id: taskId },
        data: { status: "PACKED", packedAt: /* @__PURE__ */ new Date() }
      });
      const existingSlip = task.packingSlip;
      const existingData = existingSlip?.items ?? {};
      const newItems = { ...existingData, packedBy, packedItems: items };
      if (existingSlip) {
        return prisma.packingSlip.update({
          where: { id: existingSlip.id },
          data: { packedBy, items: newItems }
        });
      }
      return prisma.packingSlip.create({
        data: { fulfillmentTaskId: taskId, packedBy, items: newItems }
      });
    };
    dispatchTask = async (taskId) => {
      const task = await prisma.fulfillmentTask.findUnique({ where: { id: taskId } });
      if (!task) throw new AppError_default(status42.NOT_FOUND, "Task not found");
      if (task.status !== "PACKED")
        throw new AppError_default(status42.BAD_REQUEST, "Task must be PACKED before dispatch");
      await prisma.order.update({
        where: { id: task.orderId },
        data: { status: "SHIPPED" }
      });
      await prisma.orderTracking.create({
        data: {
          orderId: task.orderId,
          status: "SHIPPED",
          note: "Package dispatched from warehouse. Out for final-mile delivery."
        }
      });
      return prisma.fulfillmentTask.update({
        where: { id: taskId },
        data: { status: "DISPATCHED", dispatchedAt: /* @__PURE__ */ new Date() }
      });
    };
    markDelivered = async (taskId) => {
      const task = await prisma.fulfillmentTask.findUnique({
        where: { id: taskId },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true } },
              subOrders: {
                include: { items: { select: { price: true, quantity: true } } }
              }
            }
          }
        }
      });
      if (!task) throw new AppError_default(status42.NOT_FOUND, "Task not found");
      if (task.status !== "DISPATCHED")
        throw new AppError_default(status42.BAD_REQUEST, "Task must be DISPATCHED before marking delivered");
      await prisma.$transaction(async (tx) => {
        await tx.fulfillmentTask.update({
          where: { id: taskId },
          data: { status: "DELIVERED" }
        });
        await tx.order.update({ where: { id: task.orderId }, data: { status: "DELIVERED" } });
        await tx.subOrder.updateMany({ where: { orderId: task.orderId }, data: { status: "DELIVERED" } });
        await tx.orderItem.updateMany({ where: { orderId: task.orderId }, data: { status: "DELIVERED" } });
        await tx.orderTracking.create({
          data: {
            orderId: task.orderId,
            status: "DELIVERED",
            note: "Package delivered to customer. Seller earnings credited."
          }
        });
        for (const subOrder of task.order.subOrders) {
          const fromItems = subOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
          const computedTotal = fromItems > 0 ? fromItems : subOrder.total;
          if (computedTotal <= 0) continue;
          let wallet = await tx.wallet.findUnique({ where: { userId: subOrder.sellerId } });
          if (!wallet) {
            wallet = await tx.wallet.create({ data: { userId: subOrder.sellerId, balance: 0 } });
          }
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: computedTotal } }
          });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: computedTotal,
              type: TransactionType.DEPOSIT,
              description: `Order #${task.orderId.slice(-8).toUpperCase()} delivered \u2014 \u09F3${computedTotal.toFixed(2)} credited`
            }
          });
        }
        await tx.notification.create({
          data: {
            userId: task.order.user.id,
            type: "ORDER_UPDATE",
            title: "Your order has been delivered! \u{1F389}",
            body: `Order #${task.orderId.slice(-8).toUpperCase()} has been successfully delivered to your address.`
          }
        });
      });
      return { message: "Delivered. Seller wallets credited.", orderId: task.orderId };
    };
    getTask = (taskId) => prisma.fulfillmentTask.findUnique({
      where: { id: taskId },
      include: {
        order: {
          include: {
            items: { include: { medicine: true } },
            user: { select: { id: true, name: true } },
            subOrders: {
              include: {
                seller: { select: { id: true, name: true } },
                shipmentLeg: { select: { id: true, status: true, stagedAt: true } }
              }
            },
            tracking: { orderBy: { createdAt: "asc" } }
          }
        },
        assignedTo: { select: { id: true, name: true } },
        packingSlip: true
      }
    });
    fulfillmentService = {
      getQueue,
      getMyQueue,
      assignTask,
      receiveSellerItems,
      packTask,
      dispatchTask,
      markDelivered,
      getTask
    };
  }
});

// src/module/fulfillment/fulfillment.route.ts
import { Router as Router32 } from "express";
import status43 from "http-status";
var router32, fulfillmentRouter;
var init_fulfillment_route = __esm({
  "src/module/fulfillment/fulfillment.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_fulfillment_service();
    init_prisma();
    router32 = Router32();
    router32.get("/my-queue", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.getMyQueue(req.user.id);
      sendResponse(res, { status: status43.OK, success: true, message: "My queue fetched", data });
    }));
    router32.get("/queue/:warehouseId", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.getQueue(req.params.warehouseId);
      sendResponse(res, { status: status43.OK, success: true, message: "Queue fetched", data });
    }));
    router32.post("/assign", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const { orderId, warehouseId, assignedToId } = req.body;
      const data = await fulfillmentService.assignTask(orderId, warehouseId, assignedToId || req.user.id);
      sendResponse(res, { status: status43.OK, success: true, message: "Task assigned", data });
    }));
    router32.patch("/:taskId/pick", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const task = await prisma.fulfillmentTask.findUnique({
        where: { id: req.params.taskId }
      });
      if (!task) {
        return sendResponse(res, { status: status43.NOT_FOUND, success: false, message: "Task not found", data: null });
      }
      const data = await fulfillmentService.assignTask(task.orderId, task.warehouseId, req.user.id);
      sendResponse(res, { status: status43.OK, success: true, message: "Picking started", data });
    }));
    router32.patch("/:taskId/receive-seller/:subOrderId", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.receiveSellerItems(
        req.params.taskId,
        req.params.subOrderId,
        req.user.id
        // passed as packedBy for PackingSlip
      );
      sendResponse(res, {
        status: status43.OK,
        success: true,
        message: data.allReceived ? "All seller items received \u2014 order ready to pack!" : `Received ${data.receivedCount}/${data.totalCount} seller shipments`,
        data
      });
    }));
    router32.patch("/:taskId/pack", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.packTask(
        req.params.taskId,
        req.user.id,
        req.body.items || []
      );
      sendResponse(res, { status: status43.OK, success: true, message: "Packed \u2014 packing slip created", data });
    }));
    router32.patch("/:taskId/dispatch", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.dispatchTask(req.params.taskId);
      sendResponse(res, { status: status43.OK, success: true, message: "Dispatched to customer", data });
    }));
    router32.patch("/:taskId/deliver", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.markDelivered(req.params.taskId);
      sendResponse(res, { status: status43.OK, success: true, message: "Order delivered. Wallets credited.", data });
    }));
    router32.get("/:taskId", auth_middleware_default(["WAREHOUSE", "ADMIN"]), catchAsync(async (req, res) => {
      const data = await fulfillmentService.getTask(req.params.taskId);
      sendResponse(res, { status: status43.OK, success: true, message: "Task fetched", data });
    }));
    fulfillmentRouter = router32;
  }
});

// src/module/expiryAlert/expiryAlert.route.ts
import { Router as Router33 } from "express";
import status44 from "http-status";
var router33, expiryAlertRouter;
var init_expiryAlert_route = __esm({
  "src/module/expiryAlert/expiryAlert.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_prisma();
    router33 = Router33();
    router33.get("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const { warehouseId, days, severity } = req.query;
      const cutoff = days ? new Date(Date.now() + Number(days) * 864e5) : void 0;
      const data = await prisma.expiryAlert.findMany({
        where: {
          ...warehouseId ? { warehouseId } : {},
          ...cutoff ? { expiresAt: { lte: cutoff } } : {},
          ...severity ? { severity } : {},
          isResolved: false
        },
        include: {
          medicine: { select: { id: true, name: true, image: true } },
          warehouse: { select: { id: true, name: true, city: true } }
        },
        orderBy: { daysLeft: "asc" }
      });
      sendResponse(res, { status: status44.OK, success: true, message: "Expiry alerts fetched", data });
    }));
    router33.patch("/:id/resolve", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await prisma.expiryAlert.update({
        where: { id: req.params.id },
        data: { isResolved: true }
      });
      sendResponse(res, { status: status44.OK, success: true, message: "Alert resolved", data });
    }));
    expiryAlertRouter = router33;
  }
});

// src/module/storageBin/storageBin.route.ts
import { Router as Router34 } from "express";
import status45 from "http-status";
var router34, storageBinRouter;
var init_storageBin_route = __esm({
  "src/module/storageBin/storageBin.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_prisma();
    router34 = Router34();
    router34.post("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await prisma.storageBin.create({ data: req.body, include: { location: true } });
      sendResponse(res, { status: status45.CREATED, success: true, message: "Bin created", data });
    }));
    router34.get("/:warehouseId", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const warehouseId = req.params.warehouseId;
      const data = await prisma.storageBin.findMany({
        where: { warehouseId },
        include: { location: true, allocations: { include: { medicine: { select: { id: true, name: true } } } } },
        orderBy: { binCode: "asc" }
      });
      sendResponse(res, { status: status45.OK, success: true, message: "Bins fetched", data });
    }));
    router34.post("/allocate", auth_middleware_default(["WAREHOUSE"]), catchAsync(async (req, res) => {
      const { binId, medicineId, quantity } = req.body;
      const bin = await prisma.storageBin.findUnique({ where: { id: binId } });
      if (!bin) return res.status(404).json({ success: false, message: "Bin not found" });
      if (bin.currentLoad + quantity > bin.capacity) {
        return res.status(400).json({ success: false, message: `Bin capacity exceeded. Available: ${bin.capacity - bin.currentLoad}` });
      }
      const [alloc] = await prisma.$transaction([
        prisma.binAllocation.upsert({
          where: { binId_medicineId: { binId, medicineId } },
          update: { quantity: { increment: quantity } },
          create: { binId, medicineId, quantity }
        }),
        prisma.storageBin.update({
          where: { id: binId },
          data: { currentLoad: { increment: quantity } }
        })
      ]);
      sendResponse(res, { status: status45.OK, success: true, message: "Medicine allocated to bin", data: alloc });
    }));
    storageBinRouter = router34;
  }
});

// src/module/supplier/supplier.route.ts
import { Router as Router35 } from "express";
import status46 from "http-status";
var router35, supplierRouter;
var init_supplier_route = __esm({
  "src/module/supplier/supplier.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_prisma();
    router35 = Router35();
    router35.post("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await prisma.supplier.create({ data: req.body });
      sendResponse(res, { status: status46.CREATED, success: true, message: "Supplier created", data });
    }));
    router35.get("/", auth_middleware_default(["ADMIN", "WAREHOUSE", "SELLER"]), catchAsync(async (_req, res) => {
      const data = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
      sendResponse(res, { status: status46.OK, success: true, message: "Suppliers fetched", data });
    }));
    router35.patch("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const data = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
      sendResponse(res, { status: status46.OK, success: true, message: "Supplier updated", data });
    }));
    router35.post("/shipments", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await prisma.supplierShipment.create({
        data: { ...req.body, expectedAt: new Date(req.body.expectedAt) },
        include: { supplier: true, warehouse: { select: { id: true, name: true } } }
      });
      sendResponse(res, { status: status46.CREATED, success: true, message: "Shipment created", data });
    }));
    router35.get("/shipments", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const warehouseId = req.query.warehouseId;
      const data = await prisma.supplierShipment.findMany({
        where: warehouseId ? { warehouseId } : {},
        include: {
          supplier: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } }
        },
        orderBy: { expectedAt: "asc" }
      });
      sendResponse(res, { status: status46.OK, success: true, message: "Shipments fetched", data });
    }));
    router35.patch("/shipments/:id/receive", auth_middleware_default(["WAREHOUSE"]), catchAsync(async (req, res) => {
      const data = await prisma.supplierShipment.update({
        where: { id: req.params.id },
        data: { status: "RECEIVED", receivedAt: /* @__PURE__ */ new Date() }
      });
      sendResponse(res, { status: status46.OK, success: true, message: "Shipment marked received", data });
    }));
    supplierRouter = router35;
  }
});

// src/module/temperatureLog/temperatureLog.route.ts
import { Router as Router36 } from "express";
import status47 from "http-status";
var router36, temperatureLogRouter;
var init_temperatureLog_route = __esm({
  "src/module/temperatureLog/temperatureLog.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_prisma();
    router36 = Router36();
    router36.post("/", auth_middleware_default(["WAREHOUSE"]), catchAsync(async (req, res) => {
      const { warehouseId, zone, temperature, minAllowed, maxAllowed } = req.body;
      const isAlert = temperature < (minAllowed ?? 2) || temperature > (maxAllowed ?? 8);
      const data = await prisma.temperatureLog.create({
        data: {
          warehouseId,
          zone,
          temperature,
          minAllowed: minAllowed ?? 2,
          maxAllowed: maxAllowed ?? 8,
          isAlert,
          recordedById: req.user.id
        }
      });
      sendResponse(res, { status: status47.CREATED, success: true, message: isAlert ? "\u26A0\uFE0F ALERT: Temperature out of range!" : "Temperature logged", data });
    }));
    router36.get("/:warehouseId", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const warehouseId = req.params.warehouseId;
      const zone = req.query.zone;
      const alertsOnly = req.query.alertsOnly === "true";
      const data = await prisma.temperatureLog.findMany({
        where: {
          warehouseId,
          ...zone ? { zone } : {},
          ...alertsOnly ? { isAlert: true } : {}
        },
        include: { recordedBy: { select: { id: true, name: true } } },
        orderBy: { recordedAt: "desc" },
        take: 200
      });
      sendResponse(res, { status: status47.OK, success: true, message: "Temperature logs fetched", data });
    }));
    temperatureLogRouter = router36;
  }
});

// src/module/warehouseAnalytics/warehouseAnalytics.route.ts
import { Router as Router37 } from "express";
import status48 from "http-status";
var router37, warehouseAnalyticsRouter;
var init_warehouseAnalytics_route = __esm({
  "src/module/warehouseAnalytics/warehouseAnalytics.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_prisma();
    router37 = Router37();
    router37.get("/:warehouseId", auth_middleware_default(["ADMIN", "WAREHOUSE"]), catchAsync(async (req, res) => {
      const warehouseId = req.params.warehouseId;
      const [
        stockCount,
        stockSum,
        fulfillmentStats,
        expiryCount,
        transferCount,
        grnCount,
        tempAlerts,
        topMedicines
      ] = await Promise.all([
        // Count unique SKUs
        prisma.locationStock.count({ where: { warehouseId } }),
        // Sum total units
        prisma.locationStock.aggregate({ where: { warehouseId }, _sum: { quantity: true } }),
        // Fulfillment breakdown by status
        prisma.fulfillmentTask.groupBy({
          by: ["status"],
          where: { warehouseId },
          _count: true
        }),
        // Active expiry alerts
        prisma.expiryAlert.count({ where: { warehouseId, isResolved: false } }),
        // Transfer count (in + out)
        prisma.stockTransfer.count({
          where: { OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }] }
        }),
        // GRN count
        prisma.goodsReceiptNote.count({ where: { warehouseId } }),
        // Temperature alerts (last 7 days)
        prisma.temperatureLog.count({
          where: {
            warehouseId,
            isAlert: true,
            recordedAt: { gte: new Date(Date.now() - 7 * 864e5) }
          }
        }),
        // Top 5 stocked medicines
        prisma.locationStock.findMany({
          where: { warehouseId },
          orderBy: { quantity: "desc" },
          take: 5,
          include: { medicine: { select: { id: true, name: true, price: true, image: true } } }
        })
      ]);
      const data = {
        totalSkus: stockCount,
        totalUnits: stockSum._sum.quantity ?? 0,
        fulfillment: Object.fromEntries(fulfillmentStats.map((f) => [f.status, f._count])),
        expiryAlerts: expiryCount,
        transfers: transferCount,
        grns: grnCount,
        tempAlerts7d: tempAlerts,
        topMedicines
      };
      sendResponse(res, { status: status48.OK, success: true, message: "Analytics fetched", data });
    }));
    warehouseAnalyticsRouter = router37;
  }
});

// src/module/shipmentLeg/shipmentLeg.service.ts
import status49 from "http-status";
async function ensureTaskOnLegArrival(orderId) {
  await ensureFulfillmentTask(orderId);
}
var getLegsForWarehouse, getLegsForUser, getAllLegs, receiveAtOrigin, dispatchToDestination, receiveAtDest, shipmentLegService;
var init_shipmentLeg_service = __esm({
  "src/module/shipmentLeg/shipmentLeg.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    init_subOrder_service();
    getLegsForWarehouse = (warehouseId) => prisma.shipmentLeg.findMany({
      where: {
        OR: [
          { originWarehouseId: warehouseId },
          { destWarehouseId: warehouseId }
        ]
      },
      include: {
        subOrder: {
          include: {
            seller: { select: { id: true, name: true, email: true } },
            items: { include: { medicine: { select: { id: true, name: true, image: true } } } }
          }
        },
        order: { select: { id: true, address: true, user: { select: { name: true, email: true } } } },
        originWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } },
        destWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    getLegsForUser = async (userId) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role === "ADMIN") return getAllLegs();
      const warehouses = await prisma.warehouse.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      if (!warehouses.length) return [];
      const warehouseIds = warehouses.map((w) => w.id);
      return prisma.shipmentLeg.findMany({
        where: {
          OR: [
            { originWarehouseId: { in: warehouseIds } },
            { destWarehouseId: { in: warehouseIds } }
          ]
        },
        include: {
          subOrder: {
            include: {
              seller: { select: { id: true, name: true, email: true } },
              items: { include: { medicine: { select: { id: true, name: true, image: true } } } }
            }
          },
          order: { select: { id: true, address: true, user: { select: { name: true, email: true } } } },
          originWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } },
          destWarehouse: { select: { id: true, name: true, city: true, address: true, phone: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getAllLegs = (filterStatus) => prisma.shipmentLeg.findMany({
      ...filterStatus ? { where: { status: filterStatus } } : {},
      include: {
        subOrder: {
          include: {
            seller: { select: { id: true, name: true } },
            items: { select: { quantity: true, price: true } }
          }
        },
        order: { select: { id: true, address: true } },
        originWarehouse: { select: { id: true, name: true, city: true } },
        destWarehouse: { select: { id: true, name: true, city: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    receiveAtOrigin = async (legId) => {
      const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId } });
      if (!leg) throw new AppError_default(status49.NOT_FOUND, "Shipment leg not found");
      if (leg.status !== "AWAITING_ORIGIN_WH")
        throw new AppError_default(status49.BAD_REQUEST, `Cannot receive: current status is ${leg.status}`);
      const sameWarehouse = leg.originWarehouseId === leg.destWarehouseId;
      const updated = await prisma.shipmentLeg.update({
        where: { id: legId },
        data: {
          // If origin == dest, skip IN_TRANSIT and go straight to AT_DEST_WH
          status: sameWarehouse ? "AT_DEST_WH" : "AT_ORIGIN_WH",
          arrivedAtOriginAt: /* @__PURE__ */ new Date(),
          ...sameWarehouse ? { arrivedAtDestAt: /* @__PURE__ */ new Date() } : {}
        }
      });
      if (sameWarehouse) {
        await ensureTaskOnLegArrival(leg.orderId);
      }
      return { leg: updated };
    };
    dispatchToDestination = async (legId) => {
      const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId } });
      if (!leg) throw new AppError_default(status49.NOT_FOUND, "Shipment leg not found");
      if (leg.status !== "AT_ORIGIN_WH")
        throw new AppError_default(status49.BAD_REQUEST, `Cannot dispatch: current status is ${leg.status}`);
      return prisma.shipmentLeg.update({
        where: { id: legId },
        data: { status: "IN_TRANSIT", dispatchedAt: /* @__PURE__ */ new Date() }
      });
    };
    receiveAtDest = async (legId) => {
      const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId } });
      if (!leg) throw new AppError_default(status49.NOT_FOUND, "Shipment leg not found");
      if (!["IN_TRANSIT", "AT_ORIGIN_WH"].includes(leg.status))
        throw new AppError_default(status49.BAD_REQUEST, `Cannot receive at dest: current status is ${leg.status}`);
      const updated = await prisma.shipmentLeg.update({
        where: { id: legId },
        data: { status: "AT_DEST_WH", arrivedAtDestAt: /* @__PURE__ */ new Date() }
      });
      await ensureTaskOnLegArrival(leg.orderId);
      return { leg: updated };
    };
    shipmentLegService = {
      getLegsForWarehouse,
      getLegsForUser,
      getAllLegs,
      receiveAtOrigin,
      dispatchToDestination,
      receiveAtDest
    };
  }
});

// src/module/shipmentLeg/shipmentLeg.controller.ts
import status50 from "http-status";
var getLegs, getMyLegs, receiveAtOrigin2, dispatchToDestination2, receiveAtDest2, shipmentLegController;
var init_shipmentLeg_controller = __esm({
  "src/module/shipmentLeg/shipmentLeg.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_shipmentLeg_service();
    getLegs = catchAsync(async (req, res) => {
      const warehouseId = req.query.warehouseId;
      const filterStatus = req.query.status;
      const data = warehouseId ? await shipmentLegService.getLegsForWarehouse(warehouseId) : await shipmentLegService.getAllLegs(filterStatus);
      sendResponse(res, { status: status50.OK, success: true, message: "Shipment legs fetched", data });
    });
    getMyLegs = catchAsync(async (req, res) => {
      const data = await shipmentLegService.getLegsForUser(req.user.id);
      sendResponse(res, { status: status50.OK, success: true, message: "Shipment legs fetched", data });
    });
    receiveAtOrigin2 = catchAsync(async (req, res) => {
      const data = await shipmentLegService.receiveAtOrigin(req.params.id);
      sendResponse(res, { status: status50.OK, success: true, message: "Items received at origin warehouse", data });
    });
    dispatchToDestination2 = catchAsync(async (req, res) => {
      const data = await shipmentLegService.dispatchToDestination(req.params.id);
      sendResponse(res, { status: status50.OK, success: true, message: "Shipment dispatched to destination warehouse", data });
    });
    receiveAtDest2 = catchAsync(async (req, res) => {
      const data = await shipmentLegService.receiveAtDest(req.params.id);
      sendResponse(res, { status: status50.OK, success: true, message: "Items received at destination warehouse", data });
    });
    shipmentLegController = {
      getLegs,
      getMyLegs,
      receiveAtOrigin: receiveAtOrigin2,
      dispatchToDestination: dispatchToDestination2,
      receiveAtDest: receiveAtDest2
    };
  }
});

// src/module/shipmentLeg/shipmentLeg.route.ts
import express from "express";
var router38, shipmentLegRouter;
var init_shipmentLeg_route = __esm({
  "src/module/shipmentLeg/shipmentLeg.route.ts"() {
    "use strict";
    init_shipmentLeg_controller();
    init_auth_middleware();
    router38 = express.Router();
    router38.get("/mine", auth_middleware_default(["ADMIN", "WAREHOUSE"]), shipmentLegController.getMyLegs);
    router38.get("/", auth_middleware_default(["ADMIN", "WAREHOUSE"]), shipmentLegController.getLegs);
    router38.patch("/:id/receive-at-origin", auth_middleware_default(["WAREHOUSE"]), shipmentLegController.receiveAtOrigin);
    router38.patch("/:id/dispatch", auth_middleware_default(["WAREHOUSE"]), shipmentLegController.dispatchToDestination);
    router38.patch("/:id/receive-at-dest", auth_middleware_default(["WAREHOUSE"]), shipmentLegController.receiveAtDest);
    shipmentLegRouter = router38;
  }
});

// src/module/profile/profile.service.ts
import status51 from "http-status";
async function resolveNearestWH(cityOrAddress) {
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } });
  if (!warehouses.length) return null;
  if (warehouses.length === 1) return { ...warehouses[0], distanceKm: "0" };
  const coords = extractCoordsFromBDAddress(cityOrAddress);
  if (!coords) return { ...warehouses[0], distanceKm: "?" };
  const nearest = warehouses.reduce(
    (best, wh) => haversineKm(coords.lat, coords.lng, wh.lat, wh.lng) < haversineKm(coords.lat, coords.lng, best.lat, best.lng) ? wh : best
  );
  const dist = haversineKm(coords.lat, coords.lng, nearest.lat, nearest.lng);
  return { ...nearest, distanceKm: dist.toFixed(1) };
}
function computeIsCompletedProfile(user, role) {
  const base = !!(user.name && user.phone && user.image);
  if (role === "SELLER") return !!(user.name && user.phone && user.image && user.businessCity);
  return base;
}
var getMyProfile, updateMyProfile;
var init_profile_service = __esm({
  "src/module/profile/profile.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    init_bdGeo();
    getMyProfile = async (userId, role) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          businessCity: true,
          createdAt: true,
          updatedAt: true,
          isBanned: true,
          wallet: { select: { id: true, balance: true } },
          sellerLicense: { select: { status: true, licenseNumber: true, documentUrl: true } },
          managedWarehouses: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              phone: true,
              isActive: true,
              lat: true,
              lng: true,
              _count: { select: { locationStocks: true, fulfillmentTasks: true } }
            }
          }
        }
      });
      if (!user) throw new AppError_default(status51.NOT_FOUND, "User not found");
      const isCompletedProfile = computeIsCompletedProfile(user, role);
      let extra = {};
      if (role === "SELLER") {
        const [totalMedicines, totalSubOrders, totalReviews, revenueAgg] = await Promise.all([
          prisma.medicine.count({ where: { sellerId: userId } }),
          prisma.subOrder.count({ where: { sellerId: userId } }),
          prisma.review.count({ where: { medicine: { sellerId: userId } } }),
          prisma.subOrder.aggregate({
            where: { sellerId: userId, status: "DELIVERED" },
            _sum: { total: true }
          })
        ]);
        const nearestOriginWarehouse = user.businessCity ? await resolveNearestWH(user.businessCity) : null;
        extra = {
          totalMedicines,
          totalSubOrders,
          totalReviews,
          totalRevenue: revenueAgg._sum.total ?? 0,
          nearestOriginWarehouse
        };
      }
      if (role === "CUSTOMER") {
        const [totalOrders, deliveredOrders, cancelledOrders] = await Promise.all([
          prisma.order.count({ where: { userId } }),
          prisma.order.count({ where: { userId, status: "DELIVERED" } }),
          prisma.order.count({ where: { userId, status: "CANCELLED" } })
        ]);
        extra = {
          totalOrders,
          deliveredOrders,
          cancelledOrders,
          activeOrders: totalOrders - deliveredOrders - cancelledOrders
        };
      }
      if (role === "ADMIN") {
        const [totalUsers, totalSellers, totalCustomers, totalOrders, totalMedicines, totalWarehouses] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: "SELLER" } }),
          prisma.user.count({ where: { role: "CUSTOMER" } }),
          prisma.order.count(),
          prisma.medicine.count(),
          prisma.warehouse.count({ where: { isActive: true } })
        ]);
        extra = { totalUsers, totalSellers, totalCustomers, totalOrders, totalMedicines, totalWarehouses };
      }
      if (role === "WAREHOUSE") {
        const warehouse = user.managedWarehouses[0] ?? null;
        if (warehouse) {
          const [lowStock, outOfStock, inboundCount, fulfillCount] = await Promise.all([
            prisma.locationStock.count({
              where: { warehouseId: warehouse.id, quantity: { gt: 0, lte: 10 } }
            }),
            prisma.locationStock.count({
              where: { warehouseId: warehouse.id, quantity: 0 }
            }),
            prisma.shipmentLeg.count({
              where: {
                destWarehouseId: warehouse.id,
                status: { in: ["IN_TRANSIT", "AWAITING_ORIGIN_WH", "AT_ORIGIN_WH"] }
              }
            }),
            prisma.fulfillmentTask.count({
              where: { warehouseId: warehouse.id, status: { not: "DELIVERED" } }
            })
          ]);
          extra = { warehouseStats: { lowStock, outOfStock, inboundCount, fulfillCount } };
        }
      }
      return { ...user, isCompletedProfile, ...extra };
    };
    updateMyProfile = async (userId, data) => {
      const updateData = {};
      if (data.name) updateData.name = data.name;
      if (data.image !== void 0) updateData.image = data.image || null;
      if (data.businessCity !== void 0) updateData.businessCity = data.businessCity || null;
      if (data.phone !== void 0) updateData.phone = data.phone || null;
      return prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          businessCity: true,
          updatedAt: true
        }
      });
    };
  }
});

// src/module/profile/profile.route.ts
import { Router as Router38 } from "express";
import status52 from "http-status";
var router39, profileRouter;
var init_profile_route = __esm({
  "src/module/profile/profile.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_catchAsync();
    init_sendResponse();
    init_profile_service();
    router39 = Router38();
    router39.get(
      "/me",
      auth_middleware_default(["SELLER", "CUSTOMER", "ADMIN", "WAREHOUSE"]),
      catchAsync(async (req, res) => {
        const data = await getMyProfile(req.user.id, req.user.role);
        sendResponse(res, { status: status52.OK, success: true, message: "Profile fetched", data });
      })
    );
    router39.patch(
      "/me",
      auth_middleware_default(["SELLER", "CUSTOMER", "ADMIN", "WAREHOUSE"]),
      catchAsync(async (req, res) => {
        const { name, image, businessCity, phone } = req.body;
        const data = await updateMyProfile(req.user.id, { name, image, businessCity, phone });
        sendResponse(res, { status: status52.OK, success: true, message: "Profile updated", data });
      })
    );
    profileRouter = router39;
  }
});

// src/app.ts
import express2 from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
var app, allowedOrigins, app_default;
var init_app = __esm({
  "src/app.ts"() {
    "use strict";
    init_auth();
    init_seller_route();
    init_order_route();
    init_admin_route();
    init_auth_route();
    init_medicine_router();
    init_cart_router();
    init_prescription_route();
    init_wallet_route();
    init_subscription_route();
    init_stockAlert_route();
    init_medicineBatch_route();
    init_search_route();
    init_coupon_route();
    init_sellerLicense_route();
    init_notification_route();
    init_return_route();
    init_wishlist_route();
    init_subOrder_route();
    init_banner_route();
    init_platformFeature_route();
    init_flashSale_route();
    init_blog_route();
    init_testimonial_route();
    init_newsletter_route();
    init_payment_route();
    init_contact_route();
    init_globalErrorHandler();
    init_dashboard_route();
    init_chatbot_route();
    init_warehouse_route();
    init_stockTransfer_route();
    init_grn_route();
    init_fulfillment_route();
    init_expiryAlert_route();
    init_storageBin_route();
    init_supplier_route();
    init_temperatureLog_route();
    init_warehouseAnalytics_route();
    init_shipmentLeg_route();
    init_profile_route();
    app = express2();
    app.use(cookieParser());
    app.use((req, res, next) => {
      if (req.headers["content-type"]?.startsWith("multipart/form-data")) return next();
      express2.json()(req, res, next);
    });
    app.use(express2.urlencoded({ extended: true }));
    allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:4000",
      "https://medi-store-frontend-khaki.vercel.app",
      "https://medistorefrontend.vercel.app"
    ].filter(Boolean);
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const isAllowed = allowedOrigins.includes(origin) || /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin);
          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
        exposedHeaders: ["Set-Cookie"]
      })
    );
    app.use("/api/auth", authRouter);
    app.use("/api/dashboard", dashboardRouter);
    app.use("/api/chatbot", chatbotRouter);
    app.use("/api/seller", sellerRouter);
    app.use("/api/orders", orderRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/medicines", medicineRouter);
    app.use("/api/cart", cartRouter);
    app.use("/api/prescriptions", prescriptionRouter);
    app.use("/api/wallet", walletRouter);
    app.use("/api/subscriptions", subscriptionRouter);
    app.use("/api/stock-alerts", stockAlertRouter);
    app.use("/api/batches", medicineBatchRouter);
    app.use("/api/search", searchRouter);
    app.use("/api/coupons", couponRouter);
    app.use("/api/seller-license", sellerLicenseRouter);
    app.use("/api/notifications", notificationRouter);
    app.use("/api/returns", returnRouter);
    app.use("/api/wishlist", wishlistRouter);
    app.use("/api/sub-orders", subOrderRouter);
    app.use("/api/banners", bannerRouter);
    app.use("/api/platform-features", platformFeatureRouter);
    app.use("/api/flash-sales", flashSaleRouter);
    app.use("/api/blogs", blogRouter);
    app.use("/api/testimonials", testimonialRouter);
    app.use("/api/newsletter", newsletterRouter);
    app.use("/api/payments", paymentRouter);
    app.use("/api/contact", contactRouter);
    app.use("/api/warehouses", warehouseRouter);
    app.use("/api/stock-transfers", stockTransferRouter);
    app.use("/api/grn", grnRouter);
    app.use("/api/fulfillment", fulfillmentRouter);
    app.use("/api/expiry-alerts", expiryAlertRouter);
    app.use("/api/storage-bins", storageBinRouter);
    app.use("/api/suppliers", supplierRouter);
    app.use("/api/temperature-logs", temperatureLogRouter);
    app.use("/api/warehouse-analytics", warehouseAnalyticsRouter);
    app.use("/api/shipment-legs", shipmentLegRouter);
    app.use("/api/profile", profileRouter);
    app.all("/api/auth/*splat", toNodeHandler(auth));
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "MediStore API is running \u{1F680}",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    });
    app.use(globalErrorHandler);
    app_default = app;
  }
});

// src/server.ts
var require_server = __commonJS({
  "src/server.ts"() {
    init_app();
    init_prisma();
    var PORT = process.env.PORT || 5e3;
    async function main() {
      try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
        app_default.listen(PORT, () => {
          console.log(`Server is running on http://localhost:${PORT}`);
        });
      } catch (error) {
        console.error("An error occurred:", error);
        await prisma.$disconnect();
        process.exit(1);
      }
    }
    main();
  }
});
export default require_server();
