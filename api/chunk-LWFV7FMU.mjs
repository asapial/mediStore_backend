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
  WAREHOUSE
}

enum OrderStatus {
  PLACED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PrescriptionStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  PURCHASE
  REFUND
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
}

enum SubscriptionFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
}

enum CouponType {
  PERCENTAGE
  FIXED
}

enum LicenseStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum NotificationType {
  ORDER_UPDATE
  LOW_STOCK
  SUBSCRIPTION_REFILL
  SYSTEM
  RETURN_UPDATE
}

enum ReturnStatus {
  REQUESTED
  APPROVED
  REJECTED
  COMPLETED
}

enum TrackingStatus {
  PLACED
  CONFIRMED
  SHIPPED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  image        String?
  // password  String 
  role         Role     @default(CUSTOMER)
  isBanned     Boolean  @default(false)
  businessCity String? // Seller's dispatch city \u2014 used for origin WH auto-assignment
  phone        String? // Contact phone \u2014 collected for all roles on profile
  createdAt    DateTime @default(now())

  medicines           Medicine[]
  orders              Order[]
  reviews             Review[]
  emailVerified       Boolean         @default(false)
  updatedAt           DateTime        @updatedAt
  sessions            Session[]
  accounts            Account[]
  cart                Cart?
  wallet              Wallet?
  prescriptions       Prescription[]
  subscriptions       Subscription[]
  sellerSubscriptions Subscription[]  @relation("SellerSubscriptions")
  notifications       Notification[]
  returnRequests      ReturnRequest[]
  wishlist            Wishlist?
  sellerLicense       SellerLicense?
  sellerCoupons       Coupon[]        @relation("SellerCoupons")
  couponUsages        CouponUsage[]
  sellerSubOrders     SubOrder[]      @relation("SellerSubOrders")
  flashSales          FlashSale[]     @relation("SellerFlashSales")
  blogs               Blog[]          @relation("UserBlogs")
  testimonials        Testimonial[]   @relation("UserTestimonials")

  // Warehouse relations
  managedWarehouses Warehouse[]        @relation("WarehouseManager")
  transferRequests  StockTransfer[]    @relation("TransferRequests")
  grnReceived       GoodsReceiptNote[] @relation("GRNReceiver")
  fulfillmentTasks  FulfillmentTask[]  @relation("FulfillmentWorker")
  temperatureLogs   TemperatureLog[]   @relation("TempLogger")

  // Seller withdrawal requests
  sellerWithdrawals WithdrawalRequest[] @relation("SellerWithdrawals")

  // Warehouse location change requests
  locationRequestsMade     WarehouseLocationRequest[] @relation("LocationRequester")
  locationRequestsReviewed WarehouseLocationRequest[] @relation("LocationReviewer")

  @@map("user")
}

model Category {
  id         String     @id @default(cuid())
  name       String     @unique
  icon       String? // emoji or lucide icon name
  color      String? // tailwind color or hex
  isFeatured Boolean    @default(false)
  medicines  Medicine[]
}

model Medicine {
  id            String   @id @default(cuid())
  name          String
  description   String
  image         String?
  price         Float
  discountPrice Float?
  stock         Int
  manufacturer  String
  genericName   String?
  sellerId      String
  categoryId    String
  isFeatured    Boolean  @default(false)
  createdAt     DateTime @default(now())

  seller         User                @relation(fields: [sellerId], references: [id])
  category       Category            @relation(fields: [categoryId], references: [id])
  reviews        Review[]
  orderItems     OrderItem[]
  cartItems      CartItem[]
  batches        MedicineBatch[]
  stockAlert     StockAlert?
  subscriptions  Subscription[]
  wishlistItems  WishlistItem[]
  flashSales     FlashSale[]
  // Warehouse
  locationStocks LocationStock[]
  binAllocations BinAllocation[]
  transferItems  StockTransferItem[]
  grnItems       GRNItem[]
  expiryAlerts   ExpiryAlert[]
}

model MedicineBatch {
  id           String   @id @default(cuid())
  medicineId   String
  batchNumber  String
  quantity     Int
  expiryDate   DateTime
  purchaseDate DateTime @default(now())
  createdAt    DateTime @default(now())

  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@map("medicine_batch")
}

model StockAlert {
  id         String   @id @default(cuid())
  medicineId String   @unique
  threshold  Int      @default(10)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@map("stock_alert")
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  status    OrderStatus @default(PLACED)
  address   String
  createdAt DateTime    @default(now())

  user            User             @relation(fields: [userId], references: [id])
  items           OrderItem[]
  subOrders       SubOrder[]
  tracking        OrderTracking[]
  returnRequest   ReturnRequest?
  fulfillmentTask FulfillmentTask?
  shipmentLegs    ShipmentLeg[]
}

model OrderItem {
  id         String      @id @default(cuid())
  orderId    String
  medicineId String
  quantity   Int
  status     OrderStatus @default(PLACED)
  price      Float
  subOrderId String?
  order      Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  medicine   Medicine    @relation(fields: [medicineId], references: [id])
  subOrder   SubOrder?   @relation(fields: [subOrderId], references: [id])
}

model Prescription {
  id        String             @id @default(cuid())
  userId    String
  imageUrl  String
  notes     String?
  status    PrescriptionStatus @default(PENDING)
  adminNote String?
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@map("prescription")
}

model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Float    @default(0.0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User                @relation(fields: [userId], references: [id])
  transactions WalletTransaction[]

  @@map("wallet")
}

model WalletTransaction {
  id          String          @id @default(cuid())
  walletId    String
  amount      Float
  type        TransactionType
  description String?
  createdAt   DateTime        @default(now())

  wallet Wallet @relation(fields: [walletId], references: [id])

  @@map("wallet_transaction")
}

model Subscription {
  id           String                @id @default(cuid())
  userId       String
  medicineId   String
  sellerId     String
  quantity     Int                   @default(1)
  frequency    SubscriptionFrequency @default(MONTHLY)
  status       SubscriptionStatus    @default(ACTIVE)
  nextRefillAt DateTime
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  medicine Medicine @relation(fields: [medicineId], references: [id])
  seller   User     @relation("SellerSubscriptions", fields: [sellerId], references: [id])

  @@map("subscription")
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
  id            String   @id @default(cuid())
  cartId        String
  medicineId    String
  quantity      Int      @default(1)
  priceOverride Float? // flash-sale locked-in price per unit (null = regular price)
  flashQuantity Int      @default(0) // how many of \`quantity\` units are at the flash-sale price
  addedAt       DateTime @default(now())

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

// \u2500\u2500\u2500 SubOrder (Multi-Seller Split) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model SubOrder {
  id                String      @id @default(cuid())
  orderId           String
  sellerId          String
  status            OrderStatus @default(PLACED)
  total             Float       @default(0)
  originWarehouseId String? // Seller's nearest WH \u2014 set at order creation
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  order           Order        @relation(fields: [orderId], references: [id])
  seller          User         @relation("SellerSubOrders", fields: [sellerId], references: [id])
  items           OrderItem[]
  originWarehouse Warehouse?   @relation("SubOrderOriginWH", fields: [originWarehouseId], references: [id])
  shipmentLeg     ShipmentLeg?

  @@map("sub_order")
}

// \u2500\u2500\u2500 Coupons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model Coupon {
  id          String     @id @default(cuid())
  code        String     @unique
  type        CouponType @default(PERCENTAGE)
  value       Float
  minOrderAmt Float      @default(0)
  maxUses     Int        @default(100)
  usedCount   Int        @default(0)
  isActive    Boolean    @default(true)
  expiresAt   DateTime?
  sellerId    String?
  createdAt   DateTime   @default(now())

  seller User?         @relation("SellerCoupons", fields: [sellerId], references: [id])
  usages CouponUsage[]

  @@map("coupon")
}

model CouponUsage {
  id       String   @id @default(cuid())
  couponId String
  userId   String
  orderId  String?
  usedAt   DateTime @default(now())

  coupon Coupon @relation(fields: [couponId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([couponId, userId])
  @@map("coupon_usage")
}

// \u2500\u2500\u2500 Seller License \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model SellerLicense {
  id            String        @id @default(cuid())
  sellerId      String        @unique
  licenseNumber String
  documentUrl   String
  status        LicenseStatus @default(PENDING)
  adminNote     String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  seller User @relation(fields: [sellerId], references: [id])

  @@map("seller_license")
}

// \u2500\u2500\u2500 Notifications \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType @default(SYSTEM)
  title     String
  body      String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("notification")
}

// \u2500\u2500\u2500 Order Tracking \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model OrderTracking {
  id        String         @id @default(cuid())
  orderId   String
  status    TrackingStatus
  note      String?
  createdAt DateTime       @default(now())

  order Order @relation(fields: [orderId], references: [id])

  @@map("order_tracking")
}

// \u2500\u2500\u2500 Return Request \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model ReturnRequest {
  id        String       @id @default(cuid())
  orderId   String       @unique
  userId    String
  reason    String
  status    ReturnStatus @default(REQUESTED)
  adminNote String?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  order Order @relation(fields: [orderId], references: [id])
  user  User  @relation(fields: [userId], references: [id])

  @@map("return_request")
}

// \u2500\u2500\u2500 Wishlist \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
model Wishlist {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User           @relation(fields: [userId], references: [id])
  items WishlistItem[]

  @@map("wishlist")
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  medicineId String
  addedAt    DateTime @default(now())

  wishlist Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@unique([wishlistId, medicineId])
  @@map("wishlist_item")
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

// \u2500\u2500\u2500 Homepage CMS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

model Banner {
  id        String   @id @default(cuid())
  title     String
  subtitle  String?
  badge     String?
  color     String   @default("#1B3A5C") // background color
  textColor String   @default("#FFFFFF")
  icon      String? // emoji or icon identifier
  imageUrl  String?
  link      String?
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("banner")
}

model PlatformFeature {
  id          String   @id @default(cuid())
  title       String
  description String
  icon        String // emoji or icon name
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("platform_feature")
}

model FlashSale {
  id            String   @id @default(cuid())
  medicineId    String
  sellerId      String
  originalPrice Float
  discountPrice Float
  saleStock     Int
  soldCount     Int      @default(0)
  startAt       DateTime
  endAt         DateTime
  isApproved    Boolean  @default(false)
  adminNote     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  medicine Medicine @relation(fields: [medicineId], references: [id])
  seller   User     @relation("SellerFlashSales", fields: [sellerId], references: [id])

  @@map("flash_sale")
}

model Blog {
  id          String    @id @default(cuid())
  userId      String
  title       String
  slug        String    @unique
  summary     String
  content     String
  image       String?
  tags        String[] // array of tags
  isPublished Boolean   @default(false)
  isFeatured  Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  author User @relation("UserBlogs", fields: [userId], references: [id])

  @@map("blog")
}

model Testimonial {
  id         String   @id @default(cuid())
  userId     String
  content    String
  rating     Int      @default(5) // 1-5
  isApproved Boolean  @default(false)
  isFeatured Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation("UserTestimonials", fields: [userId], references: [id])

  @@map("testimonial")
}

model NewsletterSubscriber {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  subscribedAt DateTime @default(now())

  @@map("newsletter_subscriber")
}

model ContactMessage {
  id         String    @id @default(cuid())
  name       String
  email      String
  subject    String?
  message    String
  status     String    @default("UNREAD") // UNREAD | READ | ARCHIVED
  adminReply String?
  repliedAt  DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@map("contact_message")
}

// \u2500\u2500\u2500 Warehouse Management System \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

enum TransferStatus {
  PENDING
  IN_TRANSIT
  COMPLETED
  CANCELLED
}

enum GRNStatus {
  DRAFT
  SUBMITTED
  VERIFIED
}

enum FulfillmentStatus {
  PENDING // Waiting for first item to arrive at destination WH
  CONSOLIDATING // Some items staged \u2014 still waiting for others
  READY // All items arrived at destination WH \u2014 ready to pack
  PICKED
  PACKED
  DISPATCHED
  DELIVERED
}

enum ShipmentStatus {
  EXPECTED
  RECEIVED
  PARTIAL
  CANCELLED
}

enum AlertSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// 1. Warehouse Profile
model Warehouse {
  id        String   @id @default(cuid())
  name      String
  address   String
  city      String
  country   String   @default("Bangladesh")
  lat       Float
  lng       Float
  managerId String
  phone     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  manager           User                       @relation("WarehouseManager", fields: [managerId], references: [id])
  locations         WarehouseLocation[]
  locationStocks    LocationStock[]
  transfersFrom     StockTransfer[]            @relation("TransferFrom")
  transfersTo       StockTransfer[]            @relation("TransferTo")
  grns              GoodsReceiptNote[]
  fulfillmentTasks  FulfillmentTask[]
  expiryAlerts      ExpiryAlert[]
  storageBins       StorageBin[]
  shipments         SupplierShipment[]
  temperatureLogs   TemperatureLog[]
  locationRequests  WarehouseLocationRequest[]
  originLegs        ShipmentLeg[]              @relation("ShipmentLegOrigin")
  destLegs          ShipmentLeg[]              @relation("ShipmentLegDest")
  subOrdersAsOrigin SubOrder[]                 @relation("SubOrderOriginWH")

  @@map("warehouse")
}

// Warehouse location change requests (submitted by WAREHOUSE, approved by ADMIN)
enum LocationRequestStatus {
  PENDING
  APPROVED
  REJECTED
}

model WarehouseLocationRequest {
  id            String                @id @default(cuid())
  warehouseId   String
  address       String?
  city          String?
  lat           Float?
  lng           Float?
  phone         String?
  note          String?
  status        LocationRequestStatus @default(PENDING)
  adminNote     String?
  requestedById String
  reviewedById  String?
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  requestedBy User      @relation("LocationRequester", fields: [requestedById], references: [id])
  reviewedBy  User?     @relation("LocationReviewer", fields: [reviewedById], references: [id])

  @@map("warehouse_location_request")
}

// 2. Warehouse Zones / Aisles / Shelves
model WarehouseLocation {
  id          String   @id @default(cuid())
  warehouseId String
  zone        String // e.g. "A", "COLD", "CONTROLLED"
  aisle       String
  shelf       String
  description String?
  createdAt   DateTime @default(now())

  warehouse Warehouse    @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  bins      StorageBin[]

  @@unique([warehouseId, zone, aisle, shelf])
  @@map("warehouse_location")
}

// 3. Per-warehouse medicine stock
model LocationStock {
  id          String   @id @default(cuid())
  warehouseId String
  medicineId  String
  quantity    Int      @default(0)
  updatedAt   DateTime @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  medicine  Medicine  @relation(fields: [medicineId], references: [id])

  @@unique([warehouseId, medicineId])
  @@map("location_stock")
}

// 4. Physical storage bins
model StorageBin {
  id          String   @id @default(cuid())
  warehouseId String
  locationId  String
  binCode     String
  capacity    Int
  currentLoad Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  warehouse   Warehouse         @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  location    WarehouseLocation @relation(fields: [locationId], references: [id])
  allocations BinAllocation[]

  @@unique([warehouseId, binCode])
  @@map("storage_bin")
}

// 5. Medicine \u2192 bin allocation
model BinAllocation {
  id          String   @id @default(cuid())
  binId       String
  medicineId  String
  quantity    Int
  allocatedAt DateTime @default(now())

  bin      StorageBin @relation(fields: [binId], references: [id], onDelete: Cascade)
  medicine Medicine   @relation(fields: [medicineId], references: [id])

  @@unique([binId, medicineId])
  @@map("bin_allocation")
}

// 6. Inter-warehouse stock transfer
model StockTransfer {
  id              String         @id @default(cuid())
  fromWarehouseId String
  toWarehouseId   String
  requestedById   String
  status          TransferStatus @default(PENDING)
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  fromWarehouse Warehouse           @relation("TransferFrom", fields: [fromWarehouseId], references: [id])
  toWarehouse   Warehouse           @relation("TransferTo", fields: [toWarehouseId], references: [id])
  requestedBy   User                @relation("TransferRequests", fields: [requestedById], references: [id])
  items         StockTransferItem[]

  @@map("stock_transfer")
}

model StockTransferItem {
  id         String @id @default(cuid())
  transferId String
  medicineId String
  quantity   Int

  transfer StockTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  medicine Medicine      @relation(fields: [medicineId], references: [id])

  @@map("stock_transfer_item")
}

// 7. Goods Receipt Note (GRN)
model GoodsReceiptNote {
  id           String    @id @default(cuid())
  warehouseId  String
  supplierId   String
  shipmentId   String?
  receivedById String
  status       GRNStatus @default(DRAFT)
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  warehouse  Warehouse         @relation(fields: [warehouseId], references: [id])
  supplier   Supplier          @relation(fields: [supplierId], references: [id])
  shipment   SupplierShipment? @relation(fields: [shipmentId], references: [id])
  receivedBy User              @relation("GRNReceiver", fields: [receivedById], references: [id])
  items      GRNItem[]

  @@map("goods_receipt_note")
}

model GRNItem {
  id          String    @id @default(cuid())
  grnId       String
  medicineId  String
  expectedQty Int
  receivedQty Int
  batchNumber String?
  expiryDate  DateTime?

  grn      GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
  medicine Medicine         @relation(fields: [medicineId], references: [id])

  @@map("grn_item")
}

// 8. Order fulfillment task
model FulfillmentTask {
  id           String            @id @default(cuid())
  orderId      String            @unique
  warehouseId  String
  assignedToId String?
  status       FulfillmentStatus @default(PENDING)
  startedAt    DateTime?
  packedAt     DateTime?
  dispatchedAt DateTime?
  createdAt    DateTime          @default(now())

  order       Order        @relation(fields: [orderId], references: [id])
  warehouse   Warehouse    @relation(fields: [warehouseId], references: [id])
  assignedTo  User?        @relation("FulfillmentWorker", fields: [assignedToId], references: [id])
  packingSlip PackingSlip?

  @@map("fulfillment_task")
}

model PackingSlip {
  id                String   @id @default(cuid())
  fulfillmentTaskId String   @unique
  packedBy          String
  items             Json // [{medicineId, name, qty, binCode}]
  createdAt         DateTime @default(now())

  fulfillmentTask FulfillmentTask @relation(fields: [fulfillmentTaskId], references: [id])

  @@map("packing_slip")
}

// 9. Expiry monitoring
model ExpiryAlert {
  id          String        @id @default(cuid())
  warehouseId String
  medicineId  String
  batchNumber String
  expiresAt   DateTime
  daysLeft    Int
  severity    AlertSeverity
  isResolved  Boolean       @default(false)
  createdAt   DateTime      @default(now())

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  medicine  Medicine  @relation(fields: [medicineId], references: [id])

  @@map("expiry_alert")
}

// 10. Supplier
model Supplier {
  id        String   @id @default(cuid())
  name      String
  contact   String?
  email     String?
  phone     String?
  address   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  shipments SupplierShipment[]
  grns      GoodsReceiptNote[]

  @@map("supplier")
}

// 11. Supplier inbound shipment
model SupplierShipment {
  id          String         @id @default(cuid())
  supplierId  String
  warehouseId String
  status      ShipmentStatus @default(EXPECTED)
  expectedAt  DateTime
  receivedAt  DateTime?
  trackingNum String?
  notes       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  supplier  Supplier           @relation(fields: [supplierId], references: [id])
  warehouse Warehouse          @relation(fields: [warehouseId], references: [id])
  grns      GoodsReceiptNote[]

  @@map("supplier_shipment")
}

// 12. Cold chain temperature logging
model TemperatureLog {
  id           String   @id @default(cuid())
  warehouseId  String
  zone         String
  temperature  Float // Celsius
  minAllowed   Float    @default(2.0)
  maxAllowed   Float    @default(8.0)
  isAlert      Boolean  @default(false)
  recordedById String?
  recordedAt   DateTime @default(now())

  warehouse  Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  recordedBy User?     @relation("TempLogger", fields: [recordedById], references: [id])

  @@map("temperature_log")
}

// 13. Seller Withdrawal Requests
enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
}

model WithdrawalRequest {
  id            String           @id @default(cuid())
  sellerId      String
  amount        Float
  status        WithdrawalStatus @default(PENDING)
  bankName      String
  accountNumber String
  branchName    String?
  adminNote     String?
  processedAt   DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  seller User @relation("SellerWithdrawals", fields: [sellerId], references: [id])

  @@map("withdrawal_request")
}

// \u2500\u2500\u2500 Multi-Leg Shipment Routing \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Tracks each SubOrder's physical journey:
//   Seller \u2192 Origin WH \u2192 (inter-WH transfer) \u2192 Destination WH \u2192 Pack & Deliver

enum ShipmentLegStatus {
  SELLER_PREPARING // Seller hasn't marked SHIPPED yet
  AWAITING_ORIGIN_WH // Seller marked SHIPPED \u2014 origin WH should confirm receipt
  AT_ORIGIN_WH // Origin WH confirmed receipt
  IN_TRANSIT // Origin WH dispatched to destination WH
  AT_DEST_WH // Arrived at destination WH \u2014 ready to consolidate
}

model ShipmentLeg {
  id                String            @id @default(cuid())
  orderId           String
  subOrderId        String            @unique
  originWarehouseId String
  destWarehouseId   String
  status            ShipmentLegStatus @default(SELLER_PREPARING)
  arrivedAtOriginAt DateTime? // when origin WH confirmed receipt
  dispatchedAt      DateTime? // when origin WH sent to dest WH
  arrivedAtDestAt   DateTime? // when dest WH confirmed arrival
  stagedAt          DateTime? // when fulfillment worker staged items at dest WH
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  order           Order     @relation(fields: [orderId], references: [id])
  subOrder        SubOrder  @relation(fields: [subOrderId], references: [id])
  originWarehouse Warehouse @relation("ShipmentLegOrigin", fields: [originWarehouseId], references: [id])
  destWarehouse   Warehouse @relation("ShipmentLegDest", fields: [destWarehouseId], references: [id])

  @@map("shipment_leg")
}
`,
      "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
      }
    };
    config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"isBanned","kind":"scalar","type":"Boolean"},{"name":"businessCity","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"MedicineToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToUser"},{"name":"wallet","kind":"object","type":"Wallet","relationName":"UserToWallet"},{"name":"prescriptions","kind":"object","type":"Prescription","relationName":"PrescriptionToUser"},{"name":"subscriptions","kind":"object","type":"Subscription","relationName":"SubscriptionToUser"},{"name":"sellerSubscriptions","kind":"object","type":"Subscription","relationName":"SellerSubscriptions"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToUser"},{"name":"wishlist","kind":"object","type":"Wishlist","relationName":"UserToWishlist"},{"name":"sellerLicense","kind":"object","type":"SellerLicense","relationName":"SellerLicenseToUser"},{"name":"sellerCoupons","kind":"object","type":"Coupon","relationName":"SellerCoupons"},{"name":"couponUsages","kind":"object","type":"CouponUsage","relationName":"CouponUsageToUser"},{"name":"sellerSubOrders","kind":"object","type":"SubOrder","relationName":"SellerSubOrders"},{"name":"flashSales","kind":"object","type":"FlashSale","relationName":"SellerFlashSales"},{"name":"blogs","kind":"object","type":"Blog","relationName":"UserBlogs"},{"name":"testimonials","kind":"object","type":"Testimonial","relationName":"UserTestimonials"},{"name":"managedWarehouses","kind":"object","type":"Warehouse","relationName":"WarehouseManager"},{"name":"transferRequests","kind":"object","type":"StockTransfer","relationName":"TransferRequests"},{"name":"grnReceived","kind":"object","type":"GoodsReceiptNote","relationName":"GRNReceiver"},{"name":"fulfillmentTasks","kind":"object","type":"FulfillmentTask","relationName":"FulfillmentWorker"},{"name":"temperatureLogs","kind":"object","type":"TemperatureLog","relationName":"TempLogger"},{"name":"sellerWithdrawals","kind":"object","type":"WithdrawalRequest","relationName":"SellerWithdrawals"},{"name":"locationRequestsMade","kind":"object","type":"WarehouseLocationRequest","relationName":"LocationRequester"},{"name":"locationRequestsReviewed","kind":"object","type":"WarehouseLocationRequest","relationName":"LocationReviewer"}],"dbName":"user"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"icon","kind":"scalar","type":"String"},{"name":"color","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":null},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"discountPrice","kind":"scalar","type":"Float"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"genericName","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"User","relationName":"MedicineToUser"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToMedicine"},{"name":"batches","kind":"object","type":"MedicineBatch","relationName":"MedicineToMedicineBatch"},{"name":"stockAlert","kind":"object","type":"StockAlert","relationName":"MedicineToStockAlert"},{"name":"subscriptions","kind":"object","type":"Subscription","relationName":"MedicineToSubscription"},{"name":"wishlistItems","kind":"object","type":"WishlistItem","relationName":"MedicineToWishlistItem"},{"name":"flashSales","kind":"object","type":"FlashSale","relationName":"FlashSaleToMedicine"},{"name":"locationStocks","kind":"object","type":"LocationStock","relationName":"LocationStockToMedicine"},{"name":"binAllocations","kind":"object","type":"BinAllocation","relationName":"BinAllocationToMedicine"},{"name":"transferItems","kind":"object","type":"StockTransferItem","relationName":"MedicineToStockTransferItem"},{"name":"grnItems","kind":"object","type":"GRNItem","relationName":"GRNItemToMedicine"},{"name":"expiryAlerts","kind":"object","type":"ExpiryAlert","relationName":"ExpiryAlertToMedicine"}],"dbName":null},"MedicineBatch":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"batchNumber","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"purchaseDate","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToMedicineBatch"}],"dbName":"medicine_batch"},"StockAlert":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"threshold","kind":"scalar","type":"Int"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToStockAlert"}],"dbName":"stock_alert"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"address","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"OrderToSubOrder"},{"name":"tracking","kind":"object","type":"OrderTracking","relationName":"OrderToOrderTracking"},{"name":"returnRequest","kind":"object","type":"ReturnRequest","relationName":"OrderToReturnRequest"},{"name":"fulfillmentTask","kind":"object","type":"FulfillmentTask","relationName":"FulfillmentTaskToOrder"},{"name":"shipmentLegs","kind":"object","type":"ShipmentLeg","relationName":"OrderToShipmentLeg"}],"dbName":null},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"price","kind":"scalar","type":"Float"},{"name":"subOrderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"},{"name":"subOrder","kind":"object","type":"SubOrder","relationName":"OrderItemToSubOrder"}],"dbName":null},"Prescription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PrescriptionStatus"},{"name":"adminNote","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PrescriptionToUser"}],"dbName":"prescription"},"Wallet":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"balance","kind":"scalar","type":"Float"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserToWallet"},{"name":"transactions","kind":"object","type":"WalletTransaction","relationName":"WalletToWalletTransaction"}],"dbName":"wallet"},"WalletTransaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"walletId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"type","kind":"enum","type":"TransactionType"},{"name":"description","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"wallet","kind":"object","type":"Wallet","relationName":"WalletToWalletTransaction"}],"dbName":"wallet_transaction"},"Subscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"frequency","kind":"enum","type":"SubscriptionFrequency"},{"name":"status","kind":"enum","type":"SubscriptionStatus"},{"name":"nextRefillAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SubscriptionToUser"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToSubscription"},{"name":"seller","kind":"object","type":"User","relationName":"SellerSubscriptions"}],"dbName":"subscription"},"Cart":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"CartToUser"},{"name":"items","kind":"object","type":"CartItem","relationName":"CartToCartItem"}],"dbName":"cart"},"CartItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cartId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"priceOverride","kind":"scalar","type":"Float"},{"name":"flashQuantity","kind":"scalar","type":"Int"},{"name":"addedAt","kind":"scalar","type":"DateTime"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToCartItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"CartItemToMedicine"}],"dbName":"cart_item"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"}],"dbName":null},"SubOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"total","kind":"scalar","type":"Float"},{"name":"originWarehouseId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToSubOrder"},{"name":"seller","kind":"object","type":"User","relationName":"SellerSubOrders"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderItemToSubOrder"},{"name":"originWarehouse","kind":"object","type":"Warehouse","relationName":"SubOrderOriginWH"},{"name":"shipmentLeg","kind":"object","type":"ShipmentLeg","relationName":"ShipmentLegToSubOrder"}],"dbName":"sub_order"},"Coupon":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"CouponType"},{"name":"value","kind":"scalar","type":"Float"},{"name":"minOrderAmt","kind":"scalar","type":"Float"},{"name":"maxUses","kind":"scalar","type":"Int"},{"name":"usedCount","kind":"scalar","type":"Int"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"User","relationName":"SellerCoupons"},{"name":"usages","kind":"object","type":"CouponUsage","relationName":"CouponToCouponUsage"}],"dbName":"coupon"},"CouponUsage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"couponId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"usedAt","kind":"scalar","type":"DateTime"},{"name":"coupon","kind":"object","type":"Coupon","relationName":"CouponToCouponUsage"},{"name":"user","kind":"object","type":"User","relationName":"CouponUsageToUser"}],"dbName":"coupon_usage"},"SellerLicense":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"licenseNumber","kind":"scalar","type":"String"},{"name":"documentUrl","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"LicenseStatus"},{"name":"adminNote","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"User","relationName":"SellerLicenseToUser"}],"dbName":"seller_license"},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"NotificationType"},{"name":"title","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notification"},"OrderTracking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TrackingStatus"},{"name":"note","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderTracking"}],"dbName":"order_tracking"},"ReturnRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"reason","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ReturnStatus"},{"name":"adminNote","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReturnRequest"},{"name":"user","kind":"object","type":"User","relationName":"ReturnRequestToUser"}],"dbName":"return_request"},"Wishlist":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserToWishlist"},{"name":"items","kind":"object","type":"WishlistItem","relationName":"WishlistToWishlistItem"}],"dbName":"wishlist"},"WishlistItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"wishlistId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"addedAt","kind":"scalar","type":"DateTime"},{"name":"wishlist","kind":"object","type":"Wishlist","relationName":"WishlistToWishlistItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToWishlistItem"}],"dbName":"wishlist_item"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Banner":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"subtitle","kind":"scalar","type":"String"},{"name":"badge","kind":"scalar","type":"String"},{"name":"color","kind":"scalar","type":"String"},{"name":"textColor","kind":"scalar","type":"String"},{"name":"icon","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"link","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"sortOrder","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"banner"},"PlatformFeature":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"icon","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"sortOrder","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"platform_feature"},"FlashSale":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"originalPrice","kind":"scalar","type":"Float"},{"name":"discountPrice","kind":"scalar","type":"Float"},{"name":"saleStock","kind":"scalar","type":"Int"},{"name":"soldCount","kind":"scalar","type":"Int"},{"name":"startAt","kind":"scalar","type":"DateTime"},{"name":"endAt","kind":"scalar","type":"DateTime"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"adminNote","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"FlashSaleToMedicine"},{"name":"seller","kind":"object","type":"User","relationName":"SellerFlashSales"}],"dbName":"flash_sale"},"Blog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"summary","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"tags","kind":"scalar","type":"String"},{"name":"isPublished","kind":"scalar","type":"Boolean"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"author","kind":"object","type":"User","relationName":"UserBlogs"}],"dbName":"blog"},"Testimonial":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"UserTestimonials"}],"dbName":"testimonial"},"NewsletterSubscriber":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"subscribedAt","kind":"scalar","type":"DateTime"}],"dbName":"newsletter_subscriber"},"ContactMessage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"subject","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"adminReply","kind":"scalar","type":"String"},{"name":"repliedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"contact_message"},"Warehouse":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"country","kind":"scalar","type":"String"},{"name":"lat","kind":"scalar","type":"Float"},{"name":"lng","kind":"scalar","type":"Float"},{"name":"managerId","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"manager","kind":"object","type":"User","relationName":"WarehouseManager"},{"name":"locations","kind":"object","type":"WarehouseLocation","relationName":"WarehouseToWarehouseLocation"},{"name":"locationStocks","kind":"object","type":"LocationStock","relationName":"LocationStockToWarehouse"},{"name":"transfersFrom","kind":"object","type":"StockTransfer","relationName":"TransferFrom"},{"name":"transfersTo","kind":"object","type":"StockTransfer","relationName":"TransferTo"},{"name":"grns","kind":"object","type":"GoodsReceiptNote","relationName":"GoodsReceiptNoteToWarehouse"},{"name":"fulfillmentTasks","kind":"object","type":"FulfillmentTask","relationName":"FulfillmentTaskToWarehouse"},{"name":"expiryAlerts","kind":"object","type":"ExpiryAlert","relationName":"ExpiryAlertToWarehouse"},{"name":"storageBins","kind":"object","type":"StorageBin","relationName":"StorageBinToWarehouse"},{"name":"shipments","kind":"object","type":"SupplierShipment","relationName":"SupplierShipmentToWarehouse"},{"name":"temperatureLogs","kind":"object","type":"TemperatureLog","relationName":"TemperatureLogToWarehouse"},{"name":"locationRequests","kind":"object","type":"WarehouseLocationRequest","relationName":"WarehouseToWarehouseLocationRequest"},{"name":"originLegs","kind":"object","type":"ShipmentLeg","relationName":"ShipmentLegOrigin"},{"name":"destLegs","kind":"object","type":"ShipmentLeg","relationName":"ShipmentLegDest"},{"name":"subOrdersAsOrigin","kind":"object","type":"SubOrder","relationName":"SubOrderOriginWH"}],"dbName":"warehouse"},"WarehouseLocationRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"lat","kind":"scalar","type":"Float"},{"name":"lng","kind":"scalar","type":"Float"},{"name":"phone","kind":"scalar","type":"String"},{"name":"note","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"LocationRequestStatus"},{"name":"adminNote","kind":"scalar","type":"String"},{"name":"requestedById","kind":"scalar","type":"String"},{"name":"reviewedById","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"WarehouseToWarehouseLocationRequest"},{"name":"requestedBy","kind":"object","type":"User","relationName":"LocationRequester"},{"name":"reviewedBy","kind":"object","type":"User","relationName":"LocationReviewer"}],"dbName":"warehouse_location_request"},"WarehouseLocation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"zone","kind":"scalar","type":"String"},{"name":"aisle","kind":"scalar","type":"String"},{"name":"shelf","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"WarehouseToWarehouseLocation"},{"name":"bins","kind":"object","type":"StorageBin","relationName":"StorageBinToWarehouseLocation"}],"dbName":"warehouse_location"},"LocationStock":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"LocationStockToWarehouse"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"LocationStockToMedicine"}],"dbName":"location_stock"},"StorageBin":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"locationId","kind":"scalar","type":"String"},{"name":"binCode","kind":"scalar","type":"String"},{"name":"capacity","kind":"scalar","type":"Int"},{"name":"currentLoad","kind":"scalar","type":"Int"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"StorageBinToWarehouse"},{"name":"location","kind":"object","type":"WarehouseLocation","relationName":"StorageBinToWarehouseLocation"},{"name":"allocations","kind":"object","type":"BinAllocation","relationName":"BinAllocationToStorageBin"}],"dbName":"storage_bin"},"BinAllocation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"binId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"allocatedAt","kind":"scalar","type":"DateTime"},{"name":"bin","kind":"object","type":"StorageBin","relationName":"BinAllocationToStorageBin"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"BinAllocationToMedicine"}],"dbName":"bin_allocation"},"StockTransfer":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"fromWarehouseId","kind":"scalar","type":"String"},{"name":"toWarehouseId","kind":"scalar","type":"String"},{"name":"requestedById","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TransferStatus"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"fromWarehouse","kind":"object","type":"Warehouse","relationName":"TransferFrom"},{"name":"toWarehouse","kind":"object","type":"Warehouse","relationName":"TransferTo"},{"name":"requestedBy","kind":"object","type":"User","relationName":"TransferRequests"},{"name":"items","kind":"object","type":"StockTransferItem","relationName":"StockTransferToStockTransferItem"}],"dbName":"stock_transfer"},"StockTransferItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"transferId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"transfer","kind":"object","type":"StockTransfer","relationName":"StockTransferToStockTransferItem"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToStockTransferItem"}],"dbName":"stock_transfer_item"},"GoodsReceiptNote":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"supplierId","kind":"scalar","type":"String"},{"name":"shipmentId","kind":"scalar","type":"String"},{"name":"receivedById","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"GRNStatus"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"GoodsReceiptNoteToWarehouse"},{"name":"supplier","kind":"object","type":"Supplier","relationName":"GoodsReceiptNoteToSupplier"},{"name":"shipment","kind":"object","type":"SupplierShipment","relationName":"GoodsReceiptNoteToSupplierShipment"},{"name":"receivedBy","kind":"object","type":"User","relationName":"GRNReceiver"},{"name":"items","kind":"object","type":"GRNItem","relationName":"GRNItemToGoodsReceiptNote"}],"dbName":"goods_receipt_note"},"GRNItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"grnId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"expectedQty","kind":"scalar","type":"Int"},{"name":"receivedQty","kind":"scalar","type":"Int"},{"name":"batchNumber","kind":"scalar","type":"String"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"grn","kind":"object","type":"GoodsReceiptNote","relationName":"GRNItemToGoodsReceiptNote"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"GRNItemToMedicine"}],"dbName":"grn_item"},"FulfillmentTask":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"assignedToId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"FulfillmentStatus"},{"name":"startedAt","kind":"scalar","type":"DateTime"},{"name":"packedAt","kind":"scalar","type":"DateTime"},{"name":"dispatchedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"object","type":"Order","relationName":"FulfillmentTaskToOrder"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"FulfillmentTaskToWarehouse"},{"name":"assignedTo","kind":"object","type":"User","relationName":"FulfillmentWorker"},{"name":"packingSlip","kind":"object","type":"PackingSlip","relationName":"FulfillmentTaskToPackingSlip"}],"dbName":"fulfillment_task"},"PackingSlip":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"fulfillmentTaskId","kind":"scalar","type":"String"},{"name":"packedBy","kind":"scalar","type":"String"},{"name":"items","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"fulfillmentTask","kind":"object","type":"FulfillmentTask","relationName":"FulfillmentTaskToPackingSlip"}],"dbName":"packing_slip"},"ExpiryAlert":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"batchNumber","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"daysLeft","kind":"scalar","type":"Int"},{"name":"severity","kind":"enum","type":"AlertSeverity"},{"name":"isResolved","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"ExpiryAlertToWarehouse"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"ExpiryAlertToMedicine"}],"dbName":"expiry_alert"},"Supplier":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"contact","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"shipments","kind":"object","type":"SupplierShipment","relationName":"SupplierToSupplierShipment"},{"name":"grns","kind":"object","type":"GoodsReceiptNote","relationName":"GoodsReceiptNoteToSupplier"}],"dbName":"supplier"},"SupplierShipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"supplierId","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ShipmentStatus"},{"name":"expectedAt","kind":"scalar","type":"DateTime"},{"name":"receivedAt","kind":"scalar","type":"DateTime"},{"name":"trackingNum","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"supplier","kind":"object","type":"Supplier","relationName":"SupplierToSupplierShipment"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"SupplierShipmentToWarehouse"},{"name":"grns","kind":"object","type":"GoodsReceiptNote","relationName":"GoodsReceiptNoteToSupplierShipment"}],"dbName":"supplier_shipment"},"TemperatureLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"warehouseId","kind":"scalar","type":"String"},{"name":"zone","kind":"scalar","type":"String"},{"name":"temperature","kind":"scalar","type":"Float"},{"name":"minAllowed","kind":"scalar","type":"Float"},{"name":"maxAllowed","kind":"scalar","type":"Float"},{"name":"isAlert","kind":"scalar","type":"Boolean"},{"name":"recordedById","kind":"scalar","type":"String"},{"name":"recordedAt","kind":"scalar","type":"DateTime"},{"name":"warehouse","kind":"object","type":"Warehouse","relationName":"TemperatureLogToWarehouse"},{"name":"recordedBy","kind":"object","type":"User","relationName":"TempLogger"}],"dbName":"temperature_log"},"WithdrawalRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"WithdrawalStatus"},{"name":"bankName","kind":"scalar","type":"String"},{"name":"accountNumber","kind":"scalar","type":"String"},{"name":"branchName","kind":"scalar","type":"String"},{"name":"adminNote","kind":"scalar","type":"String"},{"name":"processedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"User","relationName":"SellerWithdrawals"}],"dbName":"withdrawal_request"},"ShipmentLeg":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"subOrderId","kind":"scalar","type":"String"},{"name":"originWarehouseId","kind":"scalar","type":"String"},{"name":"destWarehouseId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ShipmentLegStatus"},{"name":"arrivedAtOriginAt","kind":"scalar","type":"DateTime"},{"name":"dispatchedAt","kind":"scalar","type":"DateTime"},{"name":"arrivedAtDestAt","kind":"scalar","type":"DateTime"},{"name":"stagedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToShipmentLeg"},{"name":"subOrder","kind":"object","type":"SubOrder","relationName":"ShipmentLegToSubOrder"},{"name":"originWarehouse","kind":"object","type":"Warehouse","relationName":"ShipmentLegOrigin"},{"name":"destWarehouse","kind":"object","type":"Warehouse","relationName":"ShipmentLegDest"}],"dbName":"shipment_leg"}},"enums":{},"types":{}}');
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
var TransactionType;
var init_enums = __esm({
  "generated/prisma/enums.ts"() {
    "use strict";
    TransactionType = {
      DEPOSIT: "DEPOSIT",
      WITHDRAWAL: "WITHDRAWAL",
      PURCHASE: "PURCHASE",
      REFUND: "REFUND"
    };
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
    init_client();
    connectionString = `${process.env.DATABASE_URL}`;
    adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }
});

export {
  __esm,
  __commonJS,
  TransactionType,
  init_enums,
  prisma,
  init_prisma
};
