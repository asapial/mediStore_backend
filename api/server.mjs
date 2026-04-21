import {
  TransactionType,
  __commonJS,
  __esm,
  init_enums,
  init_prisma,
  prisma
} from "./chunk-QMMVNLXO.mjs";

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
            type: ["CUSTOMER", "SELLER", "ADMIN"],
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
              if (role === "ADMIN" || !["CUSTOMER", "SELLER"].includes(role)) {
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

// src/module/seller/seller.service.ts
import { ZodError } from "zod";
var postMedicineQuery, updateMedicineQuery, deleteMedicineQuery, getSellerOrderQuery, getSellerStats, updateOrderItemStatusQuery, sellerService;
var init_seller_service = __esm({
  "src/module/seller/seller.service.ts"() {
    "use strict";
    init_prisma();
    init_seller_types();
    postMedicineQuery = async (data, sellerId) => {
      try {
        console.log(sellerId);
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
              medicine: {
                select: {
                  sellerId: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      });
      const filteredOrders = orders.flatMap((order) => {
        const items = order.items.filter(
          (item) => item.medicine?.sellerId === id
        );
        if (!items.length) return [];
        return [{
          id: order.id,
          status: order.status,
          address: order.address,
          createdAt: order.createdAt,
          user: { name: order.user?.name ?? "\u2014", email: order.user?.email ?? "\u2014" },
          items
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
    updateOrderItemStatusQuery = async (orderId, orderItemsList, status33) => {
      await prisma.orderItem.updateMany({
        where: { id: { in: orderItemsList }, orderId },
        data: { status: status33 }
      });
      if (status33 === "SHIPPED") {
        const items = await prisma.orderItem.findMany({
          where: { id: { in: orderItemsList } },
          select: { medicineId: true, quantity: true }
        });
        await Promise.all(
          items.map(
            (item) => prisma.medicine.update({
              where: { id: item.medicineId },
              data: { stock: { decrement: item.quantity } }
            })
          )
        );
      }
      const remaining = await prisma.orderItem.count({
        where: { orderId, status: { not: status33 } }
      });
      if (remaining === 0) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: status33 }
        });
      }
      return { success: true };
    };
    sellerService = {
      postMedicineQuery,
      updateMedicineQuery,
      deleteMedicineQuery,
      getSellerOrderQuery,
      getSellerStats,
      updateOrderItemStatusQuery
    };
  }
});

// src/module/seller/seller.controller.ts
import { ZodError as ZodError2 } from "zod";
var postMedicine, updateMedicine, deleteMedicine, getSellerOrder, sellerStatController, updateOrderItemStatus, sellerController;
var init_seller_controller = __esm({
  "src/module/seller/seller.controller.ts"() {
    "use strict";
    init_seller_service();
    postMedicine = async (req, res, next) => {
      try {
        const data = req.body;
        const sellerId = req.user.id;
        console.log(sellerId);
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
          message: "Internal server error1",
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
      console.log(sellerId);
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
        const { orderId, orderItemIds, status: status33 } = req.body;
        console.log(orderId, orderItemIds, status33);
        if (!orderId || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "orderId and orderItemIds are required"
          });
        }
        if (!status33) {
          return res.status(400).json({
            success: false,
            message: "status is required"
          });
        }
        const result = await sellerService.updateOrderItemStatusQuery(
          orderId,
          orderItemIds,
          status33
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
    sellerController = {
      postMedicine,
      updateMedicine,
      deleteMedicine,
      getSellerOrder,
      sellerStatController,
      updateOrderItemStatus
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
          console.log("Headers ", req.headers);
          console.log("Session ", session);
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
          quantity: z3.number().int().positive("Quantity must be at least 1")
        })
      ).min(1, "At least one order item is required")
    });
  }
});

// src/module/orders/order.service.ts
var postOrderQuery, getUserOrdersQuery, getOrderDetailsQuery, deleteOrderByCustomer, getCustomerStats, orderService;
var init_order_service = __esm({
  "src/module/orders/order.service.ts"() {
    "use strict";
    init_prisma();
    postOrderQuery = async (userId, data) => {
      return await prisma.$transaction(async (tx) => {
        const medicineIds = data.items.map((i) => i.medicineId);
        const medicines = await tx.medicine.findMany({
          where: { id: { in: medicineIds } }
        });
        if (medicines.length !== medicineIds.length) {
          throw new Error("One or more medicines not found");
        }
        const order = await tx.order.create({
          data: {
            userId,
            address: data.address
          }
        });
        const orderItemsData = data.items.map((item) => {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          return {
            orderId: order.id,
            medicineId: medicine.id,
            quantity: item.quantity,
            price: medicine.price
            // price snapshot
          };
        });
        await tx.orderItem.createMany({
          data: orderItemsData
        });
        return order;
      });
    };
    getUserOrdersQuery = async (userId) => {
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
      });
      return result;
    };
    getOrderDetailsQuery = async (orderId) => {
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
                  image: true
                }
              }
            }
          }
        }
      });
      if (!result) {
        throw new Error("Order not found");
      }
      return result;
    };
    deleteOrderByCustomer = async (orderId) => {
      const order = await prisma.order.findUnique({
        where: {
          id: orderId
        }
      });
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        throw new Error("Cannot delete delivered or cancelled orders");
      }
      await prisma.order.delete({
        where: { id: orderId }
      });
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
var getAllUsers, getUserDetails, getAllCategory, createCategory, deleteCategory, updateUser, updateCategory, getAdminStatsController, getAllOrder2, banUserController, adminUpdateUser, toggleCategoryFeatured, updateCategoryMeta, adminController;
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
        const cat = await (await import("./prisma-7A2BDF5Q.mjs")).prisma.category.findUnique({ where: { id } });
        if (!cat) return res.status(404).json({ status: false, message: "Category not found" });
        const updated = await (await import("./prisma-7A2BDF5Q.mjs")).prisma.category.update({
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
        const updated = await (await import("./prisma-7A2BDF5Q.mjs")).prisma.category.update({
          where: { id },
          data: { ...icon ? { icon } : {}, ...color ? { color } : {}, ...name ? { name } : {} }
        });
        return res.status(200).json({ status: true, message: "Category updated", data: updated });
      } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error });
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
      updateCategoryMeta
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
    router4.get("/me", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), authController.meController);
    router4.patch("/update", auth_middleware_default(["CUSTOMER", "SELLER", "ADMIN"]), authController.updateProfileController);
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
      console.log(medicines);
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
        console.log(userId);
        console.log(medicines);
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
import status from "http-status";
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
      sendResponse(res, { status: status.OK, success: true, message: "Featured medicines", data: medicines });
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
      sendResponse(res, { status: status.OK, success: true, message: `Medicine ${isFeatured ? "featured" : "unfeatured"}`, data: med });
    }));
    router5.patch("/categories/:id/featured", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const cat = await prisma.category.findUnique({ where: { id: req.params.id } });
      if (!cat) return sendResponse(res, { status: status.NOT_FOUND, success: false, message: "Category not found", data: null });
      const updated = await prisma.category.update({
        where: { id: req.params.id },
        data: { isFeatured: !cat.isFeatured }
      });
      sendResponse(res, { status: status.OK, success: true, message: `Category ${updated.isFeatured ? "featured" : "unfeatured"}`, data: updated });
    }));
    router5.get("/:id", medicineController.getMedicineById);
    medicineRouter = router5;
  }
});

// src/module/cart/cart.service.ts
var addToCartService, getMedicineCartStatus, getFromCartService, updateCartItemService, removeCartItemService, clearCartService, cartService;
var init_cart_service = __esm({
  "src/module/cart/cart.service.ts"() {
    "use strict";
    init_prisma();
    addToCartService = async (userId, medicineId, quantity = 1) => {
      console.log(userId, medicineId, quantity);
      let cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId }
        });
      }
      const cartItem = await prisma.cartItem.upsert({
        where: {
          cartId_medicineId: {
            cartId: cart.id,
            medicineId
          }
        },
        update: {
          quantity: {
            increment: quantity
          }
        },
        create: {
          cartId: cart.id,
          medicineId,
          quantity
        }
      });
      console.log(cartItem);
      return cartItem;
    };
    getMedicineCartStatus = async (userId, medicineId) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
      });
      if (!cart) {
        return { inCart: false, quantity: 0 };
      }
      const cartItem = cart.items.find((item) => item.medicineId === medicineId);
      if (!cartItem) {
        return { inCart: false, quantity: 0 };
      }
      return { inCart: true, quantity: cartItem.quantity };
    };
    getFromCartService = async (userId) => {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        // ✅ userId exists on Cart
        include: {
          items: {
            include: {
              medicine: true
            }
          }
        }
      });
      if (!cart) return { items: [], totalQuantity: 0, totalPrice: 0 };
      const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.medicine.price, 0);
      return {
        items: cart.items,
        totalQuantity,
        totalPrice
      };
    };
    updateCartItemService = async (userId, itemId, quantity) => {
      if (quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { medicine: true }
      });
      if (!cartItem) throw new Error("Cart item not found");
      if (quantity > cartItem.medicine.stock) {
        throw new Error("Quantity exceeds available stock");
      }
      const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        include: { medicine: true }
      });
      console.log(updated);
      return updated;
    };
    removeCartItemService = async (userId, itemId) => {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId }
      });
      if (!cartItem) throw new Error("Cart item not found");
      const cart = await prisma.cart.findUnique({
        where: { id: cartItem.cartId }
      });
      if (!cart || cart.userId !== userId) throw new Error("Unauthorized");
      await prisma.cartItem.delete({
        where: { id: itemId }
      });
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
        const { medicineId, quantity } = req.body;
        console.log(medicineId, quantity);
        if (!medicineId) {
          return res.status(400).json({
            success: false,
            message: "medicineId is required"
          });
        }
        const userId = req.user.id;
        const cartItem = await cartService.addToCartService(userId, medicineId, quantity || 1);
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
        const status33 = await cartService.getMedicineCartStatus(userId, medicineId);
        return res.status(200).json({
          success: true,
          data: status33
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
    getAllPrescriptions = async (status33) => {
      return prisma.prescription.findMany({
        where: status33 !== void 0 ? { status: status33 } : {},
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    reviewPrescription = async (id, status33, adminNote) => {
      return prisma.prescription.update({
        where: { id },
        data: {
          status: status33,
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
import status2 from "http-status";
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
      if (!imageUrl) throw new AppError_default(status2.BAD_REQUEST, "imageUrl is required");
      const data = await prescriptionService.uploadPrescription(userId, imageUrl, notes);
      sendResponse(res, {
        status: status2.CREATED,
        success: true,
        message: "Prescription uploaded successfully",
        data
      });
    });
    getMyPrescriptions2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const data = await prescriptionService.getMyPrescriptions(userId);
      sendResponse(res, {
        status: status2.OK,
        success: true,
        message: "Prescriptions fetched successfully",
        data
      });
    });
    getAllPrescriptions2 = catchAsync(async (req, res) => {
      const statusFilter = req.query.status;
      const data = await prescriptionService.getAllPrescriptions(statusFilter);
      sendResponse(res, {
        status: status2.OK,
        success: true,
        message: "All prescriptions fetched",
        data
      });
    });
    reviewPrescription2 = catchAsync(async (req, res) => {
      const id = String(req.params.id);
      const { status: newStatus, adminNote } = req.body;
      if (!newStatus) throw new AppError_default(status2.BAD_REQUEST, "status is required");
      const data = await prescriptionService.reviewPrescription(
        id,
        newStatus,
        adminNote
      );
      sendResponse(res, { status: status2.OK, success: true, message: "Prescription reviewed", data });
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
var getOrCreateWallet, getWalletWithTransactions, creditWallet, debitWallet, getAllWallets, walletService;
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
    walletService = {
      getWalletWithTransactions,
      creditWallet,
      debitWallet,
      getAllWallets,
      getOrCreateWallet
    };
  }
});

// src/module/wallet/wallet.controller.ts
import status3 from "http-status";
var getMyWallet, topUpWallet, getAllWallets2, adminCreditWallet, walletController;
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
      sendResponse(res, {
        status: status3.OK,
        success: true,
        message: "Wallet fetched successfully",
        data
      });
    });
    topUpWallet = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const { amount, description } = req.body;
      if (!amount || amount <= 0)
        throw new AppError_default(status3.BAD_REQUEST, "amount must be a positive number");
      const data = await walletService.creditWallet(userId, Number(amount), description);
      sendResponse(res, {
        status: status3.OK,
        success: true,
        message: "Wallet topped up successfully",
        data
      });
    });
    getAllWallets2 = catchAsync(async (_req, res) => {
      const data = await walletService.getAllWallets();
      sendResponse(res, {
        status: status3.OK,
        success: true,
        message: "All wallets fetched",
        data
      });
    });
    adminCreditWallet = catchAsync(async (req, res) => {
      const { userId, amount, description } = req.body;
      if (!userId) throw new AppError_default(status3.BAD_REQUEST, "userId is required");
      if (!amount || amount <= 0)
        throw new AppError_default(status3.BAD_REQUEST, "amount must be a positive number");
      const data = await walletService.creditWallet(userId, Number(amount), description);
      sendResponse(res, {
        status: status3.OK,
        success: true,
        message: "Wallet credited successfully",
        data
      });
    });
    walletController = {
      getMyWallet,
      topUpWallet,
      getAllWallets: getAllWallets2,
      adminCreditWallet
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
    router8.get("/", auth_middleware_default(["ADMIN"]), walletController.getAllWallets);
    router8.post("/credit", auth_middleware_default(["ADMIN"]), walletController.adminCreditWallet);
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
    updateSubscriptionStatus = async (id, userId, status33) => {
      return prisma.subscription.update({
        where: { id, userId },
        data: { status: status33 }
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
import status4 from "http-status";
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
      if (!medicineId) throw new AppError_default(status4.BAD_REQUEST, "medicineId is required");
      const data = await subscriptionService.createSubscription(
        userId,
        medicineId,
        Number(quantity),
        frequency
      );
      sendResponse(res, {
        status: status4.CREATED,
        success: true,
        message: "Subscription created successfully",
        data
      });
    });
    getMySubscriptions2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const data = await subscriptionService.getMySubscriptions(userId);
      sendResponse(res, {
        status: status4.OK,
        success: true,
        message: "Subscriptions fetched",
        data
      });
    });
    updateSubscriptionStatus2 = catchAsync(async (req, res) => {
      const userId = req.user.id;
      const id = String(req.params.id);
      const { status: newStatus } = req.body;
      if (!newStatus) throw new AppError_default(status4.BAD_REQUEST, "status is required");
      const data = await subscriptionService.updateSubscriptionStatus(
        id,
        userId,
        newStatus
      );
      sendResponse(res, { status: status4.OK, success: true, message: "Subscription updated", data });
    });
    getSellerSubscriptions2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await subscriptionService.getSellerSubscriptions(sellerId);
      sendResponse(res, {
        status: status4.OK,
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
import status5 from "http-status";
var upsertStockAlert, getSellerAlerts, getTriggeredAlerts, deleteStockAlert, stockAlertService;
var init_stockAlert_service = __esm({
  "src/module/stockAlert/stockAlert.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    upsertStockAlert = async (medicineId, threshold, isActive = true) => {
      const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
      if (!medicine) throw new AppError_default(status5.NOT_FOUND, "Medicine not found");
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
import status6 from "http-status";
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
      if (!medicineId) throw new AppError_default(status6.BAD_REQUEST, "medicineId is required");
      if (threshold === void 0 || threshold < 0)
        throw new AppError_default(status6.BAD_REQUEST, "threshold must be a non-negative number");
      const data = await stockAlertService.upsertStockAlert(
        medicineId,
        Number(threshold),
        Boolean(isActive)
      );
      sendResponse(res, {
        status: status6.OK,
        success: true,
        message: "Stock alert saved",
        data
      });
    });
    getSellerAlerts2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await stockAlertService.getSellerAlerts(sellerId);
      sendResponse(res, {
        status: status6.OK,
        success: true,
        message: "Stock alerts fetched",
        data
      });
    });
    getTriggeredAlerts2 = catchAsync(async (_req, res) => {
      const data = await stockAlertService.getTriggeredAlerts();
      sendResponse(res, {
        status: status6.OK,
        success: true,
        message: "Triggered alerts fetched",
        data
      });
    });
    deleteStockAlert2 = catchAsync(async (req, res) => {
      const medicineId = String(req.params.medicineId);
      const data = await stockAlertService.deleteStockAlert(medicineId);
      sendResponse(res, { status: status6.OK, success: true, message: "Stock alert deleted", data });
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
import status7 from "http-status";
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
        throw new AppError_default(status7.NOT_FOUND, "Medicine not found or not owned by you");
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
      if (!batch) throw new AppError_default(status7.NOT_FOUND, "Batch not found");
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
import status8 from "http-status";
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
          status8.BAD_REQUEST,
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
        status: status8.CREATED,
        success: true,
        message: "Batch created successfully",
        data
      });
    });
    getSellerBatches2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const data = await medicineBatchService.getSellerBatches(sellerId);
      sendResponse(res, {
        status: status8.OK,
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
        status: status8.OK,
        success: true,
        message: "Expiring batches fetched",
        data
      });
    });
    deleteBatch2 = catchAsync(async (req, res) => {
      const sellerId = req.user.id;
      const id = String(req.params.id);
      const data = await medicineBatchService.deleteBatch(id, sellerId);
      sendResponse(res, { status: status8.OK, success: true, message: "Batch deleted", data });
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
import status9 from "http-status";
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
        status: status9.OK,
        success: true,
        message: "Search results fetched",
        data
      });
    });
    getGenericAlternatives2 = catchAsync(async (req, res) => {
      const id = String(req.params.id);
      const data = await searchService.getGenericAlternatives(id);
      sendResponse(res, { status: status9.OK, success: true, message: "Generic alternatives fetched", data });
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
import status10 from "http-status";
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
        throw new AppError_default(status10.BAD_REQUEST, "Invalid or inactive coupon");
      if (coupon.expiresAt && coupon.expiresAt < /* @__PURE__ */ new Date())
        throw new AppError_default(status10.BAD_REQUEST, "Coupon has expired");
      if (coupon.usedCount >= coupon.maxUses)
        throw new AppError_default(status10.BAD_REQUEST, "Coupon usage limit reached");
      if (orderTotal < coupon.minOrderAmt)
        throw new AppError_default(
          status10.BAD_REQUEST,
          `Minimum order amount for this coupon is $${coupon.minOrderAmt}`
        );
      const alreadyUsed = await prisma.couponUsage.findUnique({
        where: { couponId_userId: { couponId: coupon.id, userId } }
      });
      if (alreadyUsed)
        throw new AppError_default(status10.BAD_REQUEST, "You have already used this coupon");
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
      if (exists) throw new AppError_default(status10.CONFLICT, `Coupon code "${code}" already exists`);
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
      if (!coupon) throw new AppError_default(status10.NOT_FOUND, "Coupon not found");
      return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
    };
    deleteCoupon = async (id) => {
      const coupon = await prisma.coupon.findUnique({ where: { id } });
      if (!coupon) throw new AppError_default(status10.NOT_FOUND, "Coupon not found");
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
import status11 from "http-status";
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
      sendResponse(res, { status: status11.OK, success: true, message: "Coupons fetched", data });
    });
    createCoupon2 = catchAsync(async (req, res) => {
      const { code, type, value, minOrderAmt, maxUses, expiresAt } = req.body;
      if (!code) throw new AppError_default(status11.BAD_REQUEST, "code is required");
      if (!type) throw new AppError_default(status11.BAD_REQUEST, "type is required (PERCENTAGE or FIXED)");
      if (value === void 0 || value === null)
        throw new AppError_default(status11.BAD_REQUEST, "value is required");
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
      sendResponse(res, { status: status11.CREATED, success: true, message: "Coupon created", data });
    });
    applyCoupon2 = catchAsync(async (req, res) => {
      const { code, orderTotal } = req.body;
      if (!code || !orderTotal)
        throw new AppError_default(status11.BAD_REQUEST, "code and orderTotal are required");
      const data = await couponService.applyCoupon(
        String(req.user.id),
        String(code),
        Number(orderTotal)
      );
      sendResponse(res, { status: status11.OK, success: true, message: "Coupon applied", data });
    });
    toggleCoupon2 = catchAsync(async (req, res) => {
      const data = await couponService.toggleCoupon(String(req.params.id));
      sendResponse(res, { status: status11.OK, success: true, message: "Coupon toggled", data });
    });
    deleteCoupon2 = catchAsync(async (req, res) => {
      await couponService.deleteCoupon(String(req.params.id));
      sendResponse(res, { status: status11.OK, success: true, message: "Coupon deleted", data: null });
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
import status12 from "http-status";
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
      if (!license) throw new AppError_default(status12.NOT_FOUND, "License not found");
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
      if (!license) throw new AppError_default(status12.NOT_FOUND, "License not found");
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
import status13 from "http-status";
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
      if (!licenseNumber || !documentUrl) throw new AppError_default(status13.BAD_REQUEST, "licenseNumber and documentUrl are required");
      const data = await sellerLicenseService.submitLicense(req.user.id, licenseNumber, documentUrl);
      sendResponse(res, { status: status13.OK, success: true, message: "License submitted", data });
    });
    getMyLicense2 = catchAsync(async (req, res) => {
      const data = await sellerLicenseService.getMyLicense(req.user.id);
      sendResponse(res, { status: status13.OK, success: true, message: "License fetched", data });
    });
    getAllLicenses2 = catchAsync(async (req, res) => {
      const licenseStatus = req.query.status;
      const data = await sellerLicenseService.getAllLicenses(licenseStatus);
      sendResponse(res, { status: status13.OK, success: true, message: "All licenses fetched", data });
    });
    reviewLicense2 = catchAsync(async (req, res) => {
      const sellerId = String(req.params.sellerId);
      const { status: licenseStatus, adminNote } = req.body;
      if (!licenseStatus) throw new AppError_default(status13.BAD_REQUEST, "status is required");
      const data = await sellerLicenseService.reviewLicense(sellerId, licenseStatus, adminNote);
      sendResponse(res, { status: status13.OK, success: true, message: "License reviewed", data });
    });
    deleteLicense2 = catchAsync(async (req, res) => {
      const licenseId = String(req.params.licenseId);
      const data = await sellerLicenseService.deleteLicense(licenseId);
      sendResponse(res, { status: status13.OK, success: true, message: "License deleted", data });
    });
    sellerLicenseController = { submitLicense: submitLicense2, getMyLicense: getMyLicense2, getAllLicenses: getAllLicenses2, reviewLicense: reviewLicense2, deleteLicense: deleteLicense2 };
  }
});

// src/module/sellerLicense/sellerLicense.route.ts
import { Router as Router14 } from "express";
var router14, sellerLicenseRouter;
var init_sellerLicense_route = __esm({
  "src/module/sellerLicense/sellerLicense.route.ts"() {
    "use strict";
    init_auth_middleware();
    init_sellerLicense_controller();
    router14 = Router14();
    router14.post("/", auth_middleware_default(["SELLER"]), sellerLicenseController.submitLicense);
    router14.get("/my", auth_middleware_default(["SELLER"]), sellerLicenseController.getMyLicense);
    router14.get("/", auth_middleware_default(["ADMIN"]), sellerLicenseController.getAllLicenses);
    router14.patch("/:sellerId/review", auth_middleware_default(["ADMIN"]), sellerLicenseController.reviewLicense);
    router14.delete("/:licenseId", auth_middleware_default(["ADMIN"]), sellerLicenseController.deleteLicense);
    sellerLicenseRouter = router14;
  }
});

// src/module/notification/notification.service.ts
import status14 from "http-status";
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
      if (!order) throw new AppError_default(status14.NOT_FOUND, "Order not found");
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
import status15 from "http-status";
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
      sendResponse(res, { status: status15.OK, success: true, message: "Notifications fetched", data });
    });
    getUnreadCount2 = catchAsync(async (req, res) => {
      const data = await notificationService.getUnreadCount(req.user.id);
      sendResponse(res, { status: status15.OK, success: true, message: "Unread count", data });
    });
    markAsRead2 = catchAsync(async (req, res) => {
      const id = req.params.id;
      const data = await notificationService.markAsRead(req.user.id, id);
      sendResponse(res, { status: status15.OK, success: true, message: "Marked as read", data });
    });
    getOrderTracking2 = catchAsync(async (req, res) => {
      const data = await notificationService.getOrderTracking(String(req.params.orderId));
      sendResponse(res, { status: status15.OK, success: true, message: "Tracking fetched", data });
    });
    addTrackingEvent2 = catchAsync(async (req, res) => {
      const { orderId, status: trackStatus, note } = req.body;
      const data = await notificationService.addTrackingEvent(orderId, trackStatus, note);
      sendResponse(res, { status: status15.CREATED, success: true, message: "Tracking event added", data });
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
import status16 from "http-status";
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
        throw new AppError_default(status16.BAD_REQUEST, "Only delivered orders can be returned");
      const existing = await prisma.returnRequest.findUnique({ where: { orderId } });
      if (existing)
        throw new AppError_default(status16.CONFLICT, "A return request already exists for this order");
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
      if (!req) throw new AppError_default(status16.NOT_FOUND, "Return request not found");
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
import status17 from "http-status";
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
      if (!orderId || !reason) throw new AppError_default(status17.BAD_REQUEST, "orderId and reason are required");
      const data = await returnService.submitReturn(req.user.id, orderId, reason);
      sendResponse(res, { status: status17.CREATED, success: true, message: "Return request submitted", data });
    });
    getMyReturns2 = catchAsync(async (req, res) => {
      const data = await returnService.getMyReturns(req.user.id);
      sendResponse(res, { status: status17.OK, success: true, message: "Returns fetched", data });
    });
    getAllReturns2 = catchAsync(async (req, res) => {
      const returnStatus = req.query.status;
      const data = await returnService.getAllReturns(returnStatus);
      sendResponse(res, { status: status17.OK, success: true, message: "All returns fetched", data });
    });
    updateReturnStatus2 = catchAsync(async (req, res) => {
      const id = String(req.params.id);
      const { status: returnStatus, adminNote } = req.body;
      if (!returnStatus) throw new AppError_default(status17.BAD_REQUEST, "status is required");
      const data = await returnService.updateReturnStatus(id, returnStatus, adminNote);
      sendResponse(res, { status: status17.OK, success: true, message: "Return updated", data });
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
import status18 from "http-status";
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
      if (exists) throw new AppError_default(status18.CONFLICT, "Item already in wishlist");
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
      if (!wishlist) throw new AppError_default(status18.NOT_FOUND, "Wishlist not found");
      const item = await prisma.wishlistItem.findUnique({
        where: { wishlistId_medicineId: { wishlistId: wishlist.id, medicineId } }
      });
      if (!item) throw new AppError_default(status18.NOT_FOUND, "Item not in wishlist");
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
import status19 from "http-status";
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
      sendResponse(res, { status: status19.OK, success: true, message: "Wishlist fetched", data });
    });
    addItem2 = catchAsync(async (req, res) => {
      const { medicineId } = req.body;
      if (!medicineId) throw new AppError_default(status19.BAD_REQUEST, "medicineId is required");
      const data = await wishlistService.addItem(req.user.id, medicineId);
      sendResponse(res, { status: status19.CREATED, success: true, message: "Added to wishlist", data });
    });
    removeItem2 = catchAsync(async (req, res) => {
      const data = await wishlistService.removeItem(req.user.id, String(req.params.medicineId));
      sendResponse(res, { status: status19.OK, success: true, message: "Removed from wishlist", data });
    });
    clearWishlist2 = catchAsync(async (req, res) => {
      await wishlistService.clearWishlist(req.user.id);
      sendResponse(res, { status: status19.OK, success: true, message: "Wishlist cleared", data: null });
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

// src/module/subOrder/subOrder.service.ts
import status20 from "http-status";
var getSellerSubOrders, getOrderSubOrders, updateSubOrderStatus, subOrderService;
var init_subOrder_service = __esm({
  "src/module/subOrder/subOrder.service.ts"() {
    "use strict";
    init_prisma();
    init_AppError();
    getSellerSubOrders = async (sellerId) => {
      return prisma.subOrder.findMany({
        where: { sellerId },
        include: {
          order: {
            select: {
              id: true,
              address: true,
              createdAt: true,
              user: { select: { name: true, email: true } }
            }
          },
          items: {
            include: {
              medicine: { select: { id: true, name: true, price: true, image: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    };
    getOrderSubOrders = async (orderId, userId) => {
      const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
      if (!order) throw new AppError_default(status20.NOT_FOUND, "Order not found");
      return prisma.subOrder.findMany({
        where: { orderId },
        include: {
          seller: { select: { name: true, email: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true, price: true, image: true } }
            }
          }
        }
      });
    };
    updateSubOrderStatus = async (id, sellerId, orderStatus) => {
      const sub = await prisma.subOrder.findFirst({ where: { id, sellerId } });
      if (!sub) throw new AppError_default(status20.NOT_FOUND, "Sub-order not found");
      return prisma.subOrder.update({
        where: { id },
        data: { status: orderStatus }
      });
    };
    subOrderService = {
      getSellerSubOrders,
      getOrderSubOrders,
      updateSubOrderStatus
    };
  }
});

// src/module/subOrder/subOrder.controller.ts
import status21 from "http-status";
var getSellerSubOrders2, getOrderSubOrders2, updateSubOrderStatus2, subOrderController;
var init_subOrder_controller = __esm({
  "src/module/subOrder/subOrder.controller.ts"() {
    "use strict";
    init_catchAsync();
    init_sendResponse();
    init_subOrder_service();
    getSellerSubOrders2 = catchAsync(async (req, res) => {
      const data = await subOrderService.getSellerSubOrders(req.user.id);
      sendResponse(res, { status: status21.OK, success: true, message: "Sub-orders fetched", data });
    });
    getOrderSubOrders2 = catchAsync(async (req, res) => {
      const data = await subOrderService.getOrderSubOrders(String(req.params.orderId), req.user.id);
      sendResponse(res, { status: status21.OK, success: true, message: "Order sub-orders fetched", data });
    });
    updateSubOrderStatus2 = catchAsync(async (req, res) => {
      const { status: orderStatus } = req.body;
      const data = await subOrderService.updateSubOrderStatus(String(req.params.id), req.user.id, orderStatus);
      sendResponse(res, { status: status21.OK, success: true, message: "Sub-order updated", data });
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
import status22 from "http-status";
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
      sendResponse(res, { status: status22.OK, success: true, message: "Banners fetched", data: banners });
    }));
    router19.post("/", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder } = req.body;
      if (!title) throw new AppError_default(status22.BAD_REQUEST, "title is required");
      const banner = await prisma.banner.create({
        data: { title, subtitle, badge, color: color || "#1B3A5C", textColor: textColor || "#FFFFFF", icon, imageUrl, link, isActive: isActive ?? true, sortOrder: Number(sortOrder) || 0 }
      });
      sendResponse(res, { status: status22.CREATED, success: true, message: "Banner created", data: banner });
    }));
    router19.put("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder } = req.body;
      const banner = await prisma.banner.update({
        where: { id: req.params.id },
        data: { title, subtitle, badge, color, textColor, icon, imageUrl, link, isActive, sortOrder: sortOrder !== void 0 ? Number(sortOrder) : void 0 }
      });
      sendResponse(res, { status: status22.OK, success: true, message: "Banner updated", data: banner });
    }));
    router19.delete("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.banner.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status22.OK, success: true, message: "Banner deleted", data: null });
    }));
    bannerRouter = router19;
  }
});

// src/module/platformFeature/platformFeature.route.ts
import { Router as Router20 } from "express";
import status23 from "http-status";
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
      sendResponse(res, { status: status23.OK, success: true, message: "Features fetched", data: features });
    }));
    router20.post("/", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, description, icon, isActive, sortOrder } = req.body;
      if (!title || !description || !icon) throw new AppError_default(status23.BAD_REQUEST, "title, description, icon required");
      const feat = await prisma.platformFeature.create({
        data: { title, description, icon, isActive: isActive ?? true, sortOrder: Number(sortOrder) || 0 }
      });
      sendResponse(res, { status: status23.CREATED, success: true, message: "Feature created", data: feat });
    }));
    router20.put("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { title, description, icon, isActive, sortOrder } = req.body;
      const feat = await prisma.platformFeature.update({
        where: { id: req.params.id },
        data: { title, description, icon, isActive, sortOrder: sortOrder !== void 0 ? Number(sortOrder) : void 0 }
      });
      sendResponse(res, { status: status23.OK, success: true, message: "Feature updated", data: feat });
    }));
    router20.delete("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.platformFeature.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status23.OK, success: true, message: "Feature deleted", data: null });
    }));
    platformFeatureRouter = router20;
  }
});

// src/module/flashSale/flashSale.route.ts
import { Router as Router21 } from "express";
import status24 from "http-status";
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
      sendResponse(res, { status: status24.OK, success: true, message: "Active flash sales", data: sales });
    }));
    router21.get("/my", auth_middleware_default(["SELLER"]), catchAsync(async (req, res) => {
      const sales = await prisma.flashSale.findMany({
        where: { sellerId: req.user.id },
        include: { medicine: { select: { id: true, name: true, image: true, price: true } } },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status24.OK, success: true, message: "My flash sales", data: sales });
    }));
    router21.post("/", auth_middleware_default(["SELLER"]), catchAsync(async (req, res) => {
      const { medicineId, discountPrice, saleStock, startAt, endAt } = req.body;
      if (!medicineId || !discountPrice || !saleStock || !startAt || !endAt)
        throw new AppError_default(status24.BAD_REQUEST, "medicineId, discountPrice, saleStock, startAt, endAt required");
      const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
      if (!medicine) throw new AppError_default(status24.NOT_FOUND, "Medicine not found");
      if (medicine.sellerId !== req.user.id) throw new AppError_default(status24.FORBIDDEN, "Not your medicine");
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
      sendResponse(res, { status: status24.CREATED, success: true, message: "Flash sale submitted for approval", data: sale });
    }));
    router21.delete("/:id", auth_middleware_default(["SELLER"]), catchAsync(async (req, res) => {
      const sale = await prisma.flashSale.findUnique({ where: { id: req.params.id } });
      if (!sale) throw new AppError_default(status24.NOT_FOUND, "Flash sale not found");
      if (sale.sellerId !== req.user.id) throw new AppError_default(status24.FORBIDDEN, "Forbidden");
      await prisma.flashSale.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status24.OK, success: true, message: "Flash sale cancelled", data: null });
    }));
    router21.get("/admin/all", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const sales = await prisma.flashSale.findMany({
        include: {
          medicine: { select: { id: true, name: true, image: true, price: true } },
          seller: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status24.OK, success: true, message: "All flash sales", data: sales });
    }));
    router21.patch("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { isApproved, adminNote } = req.body;
      const sale = await prisma.flashSale.update({
        where: { id: req.params.id },
        data: { isApproved, adminNote },
        include: { medicine: { select: { id: true, name: true } } }
      });
      sendResponse(res, { status: status24.OK, success: true, message: `Flash sale ${isApproved ? "approved" : "rejected"}`, data: sale });
    }));
    flashSaleRouter = router21;
  }
});

// src/module/blog/blog.route.ts
import { Router as Router22 } from "express";
import status25 from "http-status";
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
      sendResponse(res, { status: status25.OK, success: true, message: "Blogs fetched", data: blogs });
    }));
    router22.get("/my/list", auth_middleware_default(), catchAsync(async (req, res) => {
      const blogs = await prisma.blog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status25.OK, success: true, message: "My blogs", data: blogs });
    }));
    router22.get("/admin/all", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const blogs = await prisma.blog.findMany({
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status25.OK, success: true, message: "All blogs", data: blogs });
    }));
    router22.get("/:slug", catchAsync(async (req, res) => {
      const blog = await prisma.blog.findUnique({
        where: { slug: req.params.slug },
        include: { author: { select: { id: true, name: true, image: true } } }
      });
      if (!blog || !blog.isPublished) {
        return sendResponse(res, { status: status25.NOT_FOUND, success: false, message: "Blog not found", data: null });
      }
      sendResponse(res, { status: status25.OK, success: true, message: "Blog fetched", data: blog });
    }));
    router22.post("/", auth_middleware_default(), catchAsync(async (req, res) => {
      const { title, summary, content, image, tags } = req.body;
      if (!title || !summary || !content) {
        return sendResponse(res, { status: status25.BAD_REQUEST, success: false, message: "title, summary, content required", data: null });
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
      sendResponse(res, { status: status25.CREATED, success: true, message: "Blog submitted for review", data: blog });
    }));
    router22.put("/:id", auth_middleware_default(), catchAsync(async (req, res) => {
      const { id } = req.params;
      const { title, summary, content, image, tags } = req.body;
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (!existing) {
        return sendResponse(res, { status: status25.NOT_FOUND, success: false, message: "Blog not found", data: null });
      }
      if (existing.userId !== req.user.id && req.user.role !== "ADMIN") {
        return sendResponse(res, { status: status25.FORBIDDEN, success: false, message: "Not authorized to edit this blog", data: null });
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
      sendResponse(res, { status: status25.OK, success: true, message: shouldReset ? "Blog updated \u2014 pending admin review" : "Blog updated", data: blog });
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
      sendResponse(res, { status: status25.OK, success: true, message: "Blog updated", data: blog });
    }));
    router22.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.blog.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status25.OK, success: true, message: "Blog deleted", data: null });
    }));
    blogRouter = router22;
  }
});

// src/module/testimonial/testimonial.route.ts
import { Router as Router23 } from "express";
import status26 from "http-status";
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
      sendResponse(res, { status: status26.OK, success: true, message: "Testimonials fetched", data: testimonials });
    }));
    router23.post("/", auth_middleware_default(), catchAsync(async (req, res) => {
      const { content, rating } = req.body;
      if (!content) return sendResponse(res, { status: status26.BAD_REQUEST, success: false, message: "content required", data: null });
      const t = await prisma.testimonial.create({
        data: { userId: req.user.id, content, rating: Math.min(5, Math.max(1, Number(rating) || 5)) },
        include: { user: { select: { id: true, name: true, image: true } } }
      });
      sendResponse(res, { status: status26.CREATED, success: true, message: "Testimonial submitted for review", data: t });
    }));
    router23.get("/admin/all", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const testimonials = await prisma.testimonial.findMany({
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status26.OK, success: true, message: "All testimonials", data: testimonials });
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
      sendResponse(res, { status: status26.OK, success: true, message: "Testimonial updated", data: t });
    }));
    router23.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.testimonial.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status26.OK, success: true, message: "Testimonial deleted", data: null });
    }));
    testimonialRouter = router23;
  }
});

// src/module/newsletter/newsletter.route.ts
import { Router as Router24 } from "express";
import status27 from "http-status";
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
        return sendResponse(res, { status: status27.BAD_REQUEST, success: false, message: "Valid email required", data: null });
      const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (existing)
        return sendResponse(res, { status: status27.CONFLICT, success: false, message: "Already subscribed", data: null });
      const sub = await prisma.newsletterSubscriber.create({ data: { email, name } });
      sendResponse(res, { status: status27.CREATED, success: true, message: "Subscribed successfully", data: sub });
    }));
    router24.get("/", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "desc" } });
      sendResponse(res, { status: status27.OK, success: true, message: "Subscribers fetched", data: subscribers });
    }));
    router24.delete("/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status27.OK, success: true, message: "Subscriber removed", data: null });
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
import status28 from "http-status";
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
        throw new AppError_default(status28.BAD_REQUEST, "name, email, message are required");
      const msg = await prisma.contactMessage.create({
        data: { name, email, subject: subject || null, message }
      });
      sendResponse(res, { status: status28.CREATED, success: true, message: "Message sent successfully", data: msg });
    }));
    router26.get("/admin/messages", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const statusFilter = req.query.status;
      const messages = await prisma.contactMessage.findMany({
        where: statusFilter ? { status: statusFilter } : void 0,
        orderBy: { createdAt: "desc" }
      });
      sendResponse(res, { status: status28.OK, success: true, message: "Messages fetched", data: messages });
    }));
    router26.patch("/admin/:id/status", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { status: newStatus } = req.body;
      if (!["UNREAD", "READ", "ARCHIVED"].includes(newStatus))
        throw new AppError_default(status28.BAD_REQUEST, "Invalid status");
      const msg = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: { status: newStatus }
      });
      sendResponse(res, { status: status28.OK, success: true, message: "Status updated", data: msg });
    }));
    router26.post("/admin/:id/reply", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      const { reply } = req.body;
      if (!reply) throw new AppError_default(status28.BAD_REQUEST, "reply text required");
      const msg = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
      if (!msg) throw new AppError_default(status28.NOT_FOUND, "Message not found");
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
      sendResponse(res, { status: status28.OK, success: true, message: "Reply sent and stored", data: updated });
    }));
    router26.delete("/admin/:id", auth_middleware_default(["ADMIN"]), catchAsync(async (req, res) => {
      await prisma.contactMessage.delete({ where: { id: req.params.id } });
      sendResponse(res, { status: status28.OK, success: true, message: "Message deleted", data: null });
    }));
    contactRouter = router26;
  }
});

// src/config/env.ts
import dotenv from "dotenv";
import status29 from "http-status";
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
          throw new AppError_default(status29.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
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
import { v2 as cloudinary } from "cloudinary";
import status30 from "http-status";
var deleteFileFromCloudinary;
var init_cloudinary_config = __esm({
  "src/config/cloudinary.config.ts"() {
    "use strict";
    init_AppError();
    init_env();
    cloudinary.config({
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
          await cloudinary.uploader.destroy(
            publicId,
            {
              resource_type: resourceType
            }
          );
        }
      } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw new AppError_default(status30.INTERNAL_SERVER_ERROR, "Failed to delete file from Cloudinary");
      }
    };
  }
});

// src/errorHelpers/handleZodError.ts
import status31 from "http-status";
var handleZodError;
var init_handleZodError = __esm({
  "src/errorHelpers/handleZodError.ts"() {
    "use strict";
    handleZodError = (err) => {
      const statusCode = status31.BAD_REQUEST;
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
import status32 from "http-status";
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
      let statusCode = status32.INTERNAL_SERVER_ERROR;
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
        statusCode = status32.INTERNAL_SERVER_ERROR;
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

// src/app.ts
import express from "express";
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
    app = express();
    app.use(cookieParser());
    app.use(express.json());
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
