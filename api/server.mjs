var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}
var config;
var init_class = __esm({
  "generated/prisma/internal/class.ts"() {
    "use strict";
    config = {
      "previewFeatures": [],
      "clientVersion": "7.3.0",
      "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
      "activeProvider": "postgresql",
      "inlineSchema": `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  CUSTOMER
  SELLER
  ADMIN
}

enum OrderStatus {
  PLACED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  image     String?
  // password  String 
  role      Role     @default(CUSTOMER)
  isBanned  Boolean  @default(false)
  createdAt DateTime @default(now())

  medicines     Medicine[]
  orders        Order[]
  reviews       Review[]
  emailVerified Boolean    @default(false)
  updatedAt     DateTime   @updatedAt
  sessions      Session[]
  accounts      Account[]
  // @@map("user")
  cart          Cart?

  @@map("user")
}

model Category {
  id        String     @id @default(cuid())
  name      String     @unique
  medicines Medicine[]
}

model Medicine {
  id           String   @id @default(cuid())
  name         String
  description  String
  image        String?
  price        Float
  stock        Int
  manufacturer String
  sellerId     String
  categoryId   String
  createdAt    DateTime @default(now())

  seller     User        @relation(fields: [sellerId], references: [id])
  category   Category    @relation(fields: [categoryId], references: [id])
  // category   String[]
  reviews    Review[]
  orderItems OrderItem[]
  cartItems  CartItem[]
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  status    OrderStatus @default(PLACED)
  address   String
  createdAt DateTime    @default(now())

  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]
}

model OrderItem {
  id         String      @id @default(cuid())
  orderId    String
  medicineId String
  quantity   Int
  status     OrderStatus @default(PLACED)
  price      Float
  order      Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  medicine   Medicine    @relation(fields: [medicineId], references: [id])
}

// Cart model for storing a user's active shopping cart
model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique // One cart per user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User       @relation(fields: [userId], references: [id])
  items CartItem[] // Cart items relation

  @@map("cart")
}

// CartItem model for individual medicines in the cart
model CartItem {
  id         String   @id @default(cuid())
  cartId     String
  medicineId String
  quantity   Int      @default(1)
  addedAt    DateTime @default(now())

  cart     Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@unique([cartId, medicineId]) // Prevent duplicate items for the same cart
  @@map("cart_item")
}

model Review {
  id         String   @id @default(cuid())
  rating     Int
  comment    String
  userId     String
  medicineId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id])
  medicine Medicine @relation(fields: [medicineId], references: [id])
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}
`,
      "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
      }
    };
    config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"isBanned","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"MedicineToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToUser"}],"dbName":"user"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":null},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"User","relationName":"MedicineToUser"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToMedicine"}],"dbName":null},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"address","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"}],"dbName":null},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"price","kind":"scalar","type":"Float"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"}],"dbName":null},"Cart":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"CartToUser"},{"name":"items","kind":"object","type":"CartItem","relationName":"CartToCartItem"}],"dbName":"cart"},"CartItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cartId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"addedAt","kind":"scalar","type":"DateTime"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToCartItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"CartItemToMedicine"}],"dbName":"cart_item"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"}],"dbName":null},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"}},"enums":{},"types":{}}');
    config.compilerWasm = {
      getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
      getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
      },
      importName: "./query_compiler_fast_bg.js"
    };
  }
});

// generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext, NullTypes2, TransactionIsolationLevel, defineExtension;
var init_prismaNamespace = __esm({
  "generated/prisma/internal/prismaNamespace.ts"() {
    "use strict";
    getExtensionContext = runtime2.Extensions.getExtensionContext;
    NullTypes2 = {
      DbNull: runtime2.NullTypes.DbNull,
      JsonNull: runtime2.NullTypes.JsonNull,
      AnyNull: runtime2.NullTypes.AnyNull
    };
    TransactionIsolationLevel = runtime2.makeStrictEnum({
      ReadUncommitted: "ReadUncommitted",
      ReadCommitted: "ReadCommitted",
      RepeatableRead: "RepeatableRead",
      Serializable: "Serializable"
    });
    defineExtension = runtime2.Extensions.defineExtension;
  }
});

// generated/prisma/enums.ts
var init_enums = __esm({
  "generated/prisma/enums.ts"() {
    "use strict";
  }
});

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";
var PrismaClient;
var init_client = __esm({
  "generated/prisma/client.ts"() {
    "use strict";
    init_class();
    init_prismaNamespace();
    init_enums();
    init_enums();
    globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
    PrismaClient = getPrismaClientClass();
  }
});

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
var connectionString, adapter, prisma;
var init_prisma = __esm({
  "src/lib/prisma.ts"() {
    "use strict";
    init_client();
    connectionString = `${process.env.DATABASE_URL}`;
    adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }
});

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
            input: false
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
        // useSecureCookies: false,
        crossSubDomainCookies: {
          enabled: false
        },
        disableCSRFCheck: true,
        // Allow requests without Origin header (Postman, mobile apps, etc.)
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
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
      stock: z.number().int().nonnegative("Stock must be 0 or more"),
      manufacturer: z.string().min(2, "Manufacturer must be at least 2 characters"),
      categoryId: z.string().min(1, "Category ID is required")
    });
    updateMedicineSchema = z.object({
      name: z.string().min(2).optional(),
      description: z.string().min(5).optional(),
      image: z.string().url().nullable().optional(),
      price: z.number().positive().optional(),
      stock: z.number().int().nonnegative().optional(),
      manufacturer: z.string().min(2).optional(),
      category: z.array(z.string().min(1)).optional()
      // optional array
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
    updateMedicineQuery = async (id, data) => {
      try {
        const prismaData = {};
        if (data.name !== void 0) prismaData.name = { set: data.name };
        if (data.description !== void 0) prismaData.description = { set: data.description };
        if (data.price !== void 0) prismaData.price = { set: data.price };
        if (data.stock !== void 0) prismaData.stock = { set: data.stock };
        if (data.manufacturer !== void 0) prismaData.manufacturer = { set: data.manufacturer };
        if (data.category !== void 0) prismaData.category = { set: data.category };
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
      console.log("sessss", id);
      const orders = await prisma.order.findMany({
        include: {
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
                  name: true
                }
              }
            }
          }
        }
      });
      console.log(orders);
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
    updateOrderItemStatusQuery = async (orderId, orderItemsList, status) => {
      await prisma.orderItem.updateMany({
        where: {
          id: { in: orderItemsList },
          orderId
        },
        data: {
          status
          // ✅ pass the enum, not string
        }
      });
      const remaining = await prisma.orderItem.count({
        where: {
          orderId,
          status: { not: status }
        }
      });
      if (remaining === 0) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status }
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
        const { orderId, orderItemIds, status } = req.body;
        console.log(orderId, orderItemIds, status);
        if (!orderId || !Array.isArray(orderItemIds) || orderItemIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "orderId and orderItemIds are required"
          });
        }
        if (!status) {
          return res.status(400).json({
            success: false,
            message: "status is required"
          });
        }
        const result = await sellerService.updateOrderItemStatusQuery(
          orderId,
          orderItemIds,
          status
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
var postOrderQuery, getUserOrdersQuery, getOrderDetailsQuery, deleteOrderByCustomer, orderService;
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
    orderService = {
      postOrderQuery,
      getUserOrdersQuery,
      getOrderDetailsQuery,
      deleteOrderByCustomer
    };
  }
});

// src/module/orders/order.controller.ts
var createOrder, getUsersOrder, getOrderDetails, orderDeleteByCustomer, orderController;
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
    orderController = {
      createOrder,
      getUsersOrder,
      getOrderDetails,
      orderDeleteByCustomer
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
    router2.get("/", auth_middleware_default(["CUSTOMER"]), orderController.getUsersOrder);
    router2.get("/:id", auth_middleware_default(["CUSTOMER"]), orderController.getOrderDetails);
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
      const result = await prisma.category.findMany();
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
var getAllUsers, getUserDetails, getAllCategory, createCategory, deleteCategory, updateUser, updateCategory, getAdminStatsController, getAllOrder2, banUserController, adminUpdateUser, adminController;
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
        if (result.length === 0) {
          return res.status(404).json({
            status: false,
            message: "No categories found"
          });
        }
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
      deleteCategory
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
        const { email, password, name } = req.body;
        const { headers, response } = await auth.api.signUpEmail({
          returnHeaders: true,
          // we need headers for cookies
          body: { email, password, name }
        });
        const setCookie = headers.get("set-cookie");
        if (setCookie) {
          res.setHeader("Set-Cookie", setCookie);
        }
        res.status(201).json({
          message: "Registration successful",
          data: response
          // optional: return user info
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

// src/module/medicine/medicine.router.ts
import { Router as Router5 } from "express";
var router5, medicineRouter;
var init_medicine_router = __esm({
  "src/module/medicine/medicine.router.ts"() {
    "use strict";
    init_medicine_controller();
    init_auth_middleware();
    router5 = Router5();
    router5.get("/", medicineController.getAllMedicines);
    router5.get("/own", auth_middleware_default(["SELLER"]), medicineController.getMyMedicines);
    router5.get("/:id", medicineController.getMedicineById);
    medicineRouter = router5;
  }
});

// src/module/cart/cart.service.ts
var addToCartService, getMedicineCartStatus, getFromCartService, updateCartItemService, removeCartItemService, cartService;
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
    cartService = {
      addToCartService,
      getMedicineCartStatus,
      getFromCartService,
      updateCartItemService,
      removeCartItemService
    };
  }
});

// src/module/cart/cart.controller.ts
var addToCartController, getMedicineCartStatusController, getFromCartController, updateCartItemController, removeCartItemController, cartController;
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
        const status = await cartService.getMedicineCartStatus(userId, medicineId);
        return res.status(200).json({
          success: true,
          data: status
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
    cartController = {
      addToCartController,
      getMedicineCartStatusController,
      getFromCartController,
      updateCartItemController,
      removeCartItemController
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
    cartRouter = router6;
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
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    allowedOrigins = [
      "http://localhost:3000",
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
    app.use("/api/seller", sellerRouter);
    app.use("/api/orders", orderRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/medicines", medicineRouter);
    app.use("/api/cart", cartRouter);
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
