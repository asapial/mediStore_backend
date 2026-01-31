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
      "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum Role {\n  CUSTOMER\n  SELLER\n  ADMIN\n}\n\nenum OrderStatus {\n  PLACED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nmodel User {\n  id        String   @id @default(cuid())\n  name      String\n  email     String   @unique\n  image     String?\n  // password  String \n  role      Role     @default(CUSTOMER)\n  isBanned  Boolean  @default(false)\n  createdAt DateTime @default(now())\n\n  medicines     Medicine[]\n  orders        Order[]\n  reviews       Review[]\n  emailVerified Boolean    @default(false)\n  updatedAt     DateTime   @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n  // @@map("user")\n\n  @@map("user")\n}\n\nmodel Category {\n  id        String     @id @default(cuid())\n  name      String     @unique\n  medicines Medicine[]\n}\n\nmodel Medicine {\n  id           String   @id @default(cuid())\n  name         String\n  description  String\n  image        String?\n  price        Float\n  stock        Int\n  manufacturer String\n  sellerId     String\n  categoryId   String\n  createdAt    DateTime @default(now())\n\n  seller     User        @relation(fields: [sellerId], references: [id])\n  category   Category    @relation(fields: [categoryId], references: [id])\n  // category   String[]\n  reviews    Review[]\n  orderItems OrderItem[]\n}\n\nmodel Order {\n  id        String      @id @default(cuid())\n  userId    String\n  status    OrderStatus @default(PLACED)\n  address   String\n  createdAt DateTime    @default(now())\n\n  user  User        @relation(fields: [userId], references: [id])\n  items OrderItem[]\n}\n\nmodel OrderItem {\n  id         String @id @default(cuid())\n  orderId    String\n  medicineId String\n  quantity   Int\n  price      Float\n\n  order    Order    @relation(fields: [orderId], references: [id])\n  medicine Medicine @relation(fields: [medicineId], references: [id])\n}\n\nmodel Review {\n  id         String   @id @default(cuid())\n  rating     Int\n  comment    String\n  userId     String\n  medicineId String\n  createdAt  DateTime @default(now())\n\n  user     User     @relation(fields: [userId], references: [id])\n  medicine Medicine @relation(fields: [medicineId], references: [id])\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n',
      "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
      }
    };
    config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"isBanned","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"MedicineToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"}],"dbName":"user"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":null},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"User","relationName":"MedicineToUser"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"}],"dbName":null},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"address","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"}],"dbName":null},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"price","kind":"scalar","type":"Float"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"}],"dbName":null},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"}},"enums":{},"types":{}}');
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
      trustedOrigins: ["http://localhost:4000"],
      database: prismaAdapter(prisma, {
        provider: "sqlite"
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
var postMedicineQuery, updateMedicineQuery, deleteMedicineQuery, getSellerOrderQuery, sellerService;
var init_seller_service = __esm({
  "src/module/seller/seller.service.ts"() {
    "use strict";
    init_prisma();
    init_seller_types();
    postMedicineQuery = async (data) => {
      try {
        const validatedData = postMedicineSchema.parse(data);
        const prismaData = {
          ...validatedData,
          sellerId: "uEfEn65DfNiK2pD9a1krMZPAomg5WolQ",
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
      const result = await prisma.order.findMany({
        where: {
          items: {
            some: {
              medicine: {
                sellerId: id
              }
            }
          }
        },
        include: {
          items: {
            where: {
              medicine: {
                sellerId: id
              }
            },
            include: {
              medicine: {
                select: {
                  name: true,
                  description: true,
                  price: true,
                  image: true,
                  seller: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });
      console.log(result);
      return result;
    };
    sellerService = {
      postMedicineQuery,
      updateMedicineQuery,
      deleteMedicineQuery,
      getSellerOrderQuery
    };
  }
});

// src/module/seller/seller.controller.ts
import { ZodError as ZodError2 } from "zod";
var postMedicine, updateMedicine, deleteMedicine, getSellerOrder, sellerController;
var init_seller_controller = __esm({
  "src/module/seller/seller.controller.ts"() {
    "use strict";
    init_seller_service();
    postMedicine = async (req, res, next) => {
      try {
        const data = req.body;
        const result = await sellerService.postMedicineQuery(data);
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
    sellerController = {
      postMedicine,
      updateMedicine,
      deleteMedicine,
      getSellerOrder
    };
  }
});

// src/middleware/auth.middleware.ts
var toFetchHeaders, auth2, auth_middleware_default;
var init_auth_middleware = __esm({
  "src/middleware/auth.middleware.ts"() {
    "use strict";
    init_auth();
    toFetchHeaders = (headers) => {
      const result = {};
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === "string") {
          result[key] = value;
        }
      }
      return result;
    };
    auth2 = (allowedRoles) => {
      return async (req, res, next) => {
        console.log("RAW COOKIE HEADER:", req.headers.cookie);
        try {
          const session = await auth.api.getSession({
            // headers: req.headers as any,
            headers: toFetchHeaders(req.headers)
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
          console.error("Auth middleware error:", error);
          return res.status(500).json({
            success: false,
            message: "Authentication failed."
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
    router.post("/medicines", sellerController.postMedicine);
    router.put("/medicines/:id", sellerController.updateMedicine);
    router.delete("/medicines/:id", sellerController.deleteMedicine);
    router.get("/orders", auth_middleware_default(), sellerController.getSellerOrder);
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
var postOrderQuery, getUserOrdersQuery, getOrderDetailsQuery, orderService;
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
    orderService = {
      postOrderQuery,
      getUserOrdersQuery,
      getOrderDetailsQuery
    };
  }
});

// src/module/orders/order.controller.ts
var createOrder, getUsersOrder, getOrderDetails, orderController;
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
    orderController = {
      createOrder,
      getUsersOrder,
      getOrderDetails
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
    router2.post("/", auth_middleware_default(), orderController.createOrder);
    router2.get("/", auth_middleware_default(), orderController.getUsersOrder);
    router2.get("/:id", auth_middleware_default(), orderController.getOrderDetails);
    orderRouter = router2;
  }
});

// src/module/admin/admin.service.ts
var getAllUsersQuery, getAllCategoryQuery, getUserDetailsQuery, updateUserQuery, updateCategoryQuery, adminService;
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
    adminService = {
      getAllUsersQuery,
      getAllCategoryQuery,
      updateUserQuery,
      updateCategoryQuery,
      getUserDetailsQuery
    };
  }
});

// src/module/admin/admin.controller.ts
var getAllUsers, getUserDetails, getAllCategory, updateUser, updateCategory, adminController;
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
    adminController = {
      getAllUsers,
      getAllCategory,
      updateUser,
      updateCategory,
      getUserDetails
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
    router3 = Router3();
    router3.get("/users", adminController.getAllUsers);
    router3.get("/users/:id", adminController.getUserDetails);
    router3.get("/categories", adminController.getAllCategory);
    router3.put("/users/:id", adminController.updateUser);
    router3.put("/categories/:id", adminController.updateCategory);
    adminRouter = router3;
  }
});

// src/module/auth/auth.controller.ts
var registerController, loginController, meController, authController;
var init_auth_controller = __esm({
  "src/module/auth/auth.controller.ts"() {
    "use strict";
    init_auth();
    init_prisma();
    registerController = async (req, res, next) => {
      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: req.body.email,
            password: req.body.password,
            name: req.body.name
          }
        });
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    };
    loginController = async (req, res, next) => {
      try {
        const { email, password } = req.body;
        const result = await auth.api.signInEmail({
          body: {
            email,
            password
          }
        });
        res.status(200).json({
          message: "Login successful",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    meController = async (req, res, next) => {
      try {
        const userId = req.user.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
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
    authController = {
      registerController,
      loginController,
      meController
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
    authRouter = router4;
  }
});

// src/app.ts
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
var app, corsOptions, app_default;
var init_app = __esm({
  "src/app.ts"() {
    "use strict";
    init_auth();
    init_seller_route();
    init_order_route();
    init_admin_route();
    init_auth_route();
    app = express();
    app.use(express.json());
    corsOptions = {
      origin: `${process.env.ORIGIN_URL}`,
      optionsSuccessStatus: 200,
      // some legacy browsers (IE11, various SmartTVs) choke on 204
      Credential: true
    };
    app.use(
      cors(corsOptions)
    );
    app.use("/api/auth", authRouter);
    app.use("/api/seller", sellerRouter);
    app.use("/api/orders", orderRouter);
    app.use("/api/admin", adminRouter);
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
    var PORT = process.env.PORT || 3e3;
    async function main() {
      try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
        app_default.listen(PORT, () => {
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
