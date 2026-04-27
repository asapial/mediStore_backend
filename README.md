# 🏥 MediStore Backend API

> **A production-grade, multi-role pharmacy e-commerce backend built with Node.js, Express, Prisma ORM, and PostgreSQL — featuring a fully integrated multi-warehouse fulfillment system.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Workflow](#core-workflow)
- [Warehouse Fulfillment Workflow](#warehouse-fulfillment-workflow)
- [Module Reference](#module-reference)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [Project Structure](#project-structure)

---

## Overview

MediStore is a full-featured online pharmacy platform that supports multi-seller listings, prescription management, flash sales, wallet payments, and a sophisticated multi-warehouse fulfillment pipeline. Orders placed by customers are intelligently routed through the nearest warehouse using GPS-based geo-resolution, consolidated from multiple sellers, packed, and dispatched for delivery.

---

## Tech Stack

| Layer            | Technology                                    |
|------------------|-----------------------------------------------|
| Runtime          | Node.js (TypeScript)                          |
| Framework        | Express.js                                    |
| ORM              | Prisma ORM                                    |
| Database         | PostgreSQL (via Prisma)                       |
| Authentication   | Better Auth (session-based, cookie-backed)    |
| File Uploads     | Multer + Cloudinary                           |
| Email            | Nodemailer                                    |
| AI Chatbot       | Google Gemini API                             |
| Payments         | SSLCommerz                                    |
| Geo Resolution   | Custom Bangladesh district/division lookup    |
| Dev Tools        | ts-node, nodemon, eslint                      |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MediStore Backend                            │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────────┐  │
│  │ Customer │   │  Seller  │   │  Admin   │   │   Warehouse    │  │
│  │  Client  │   │  Client  │   │  Client  │   │    Manager     │  │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └───────┬────────┘  │
│       │              │              │                  │           │
│  ─────┴──────────────┴──────────────┴──────────────────┴─────────  │
│                    Express REST API (port 4000)                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Business Logic Modules (39 modules)            │   │
│  │  auth · orders · medicines · seller · cart · wallet ·       │   │
│  │  fulfillment · shipmentLeg · warehouse · grn · coupon ·     │   │
│  │  flashSale · prescription · payment · chatbot · profile...  │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────▼─────────────────────────────────┐   │
│  │               Prisma ORM  ←→  PostgreSQL                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions

| Role        | Capabilities                                                                 |
|-------------|------------------------------------------------------------------------------|
| `CUSTOMER`  | Browse, cart, checkout, track orders, wallet, prescriptions, returns         |
| `SELLER`    | List medicines, manage inventory, batches, flash sales, sub-order management |
| `ADMIN`     | Platform-wide management, license approvals, user control, CMS               |
| `WAREHOUSE` | Routing, pick & pack, dispatch, inventory, GRN, stock transfers              |

---

## Core Workflow

### 1. Order Placement
```
Customer selects medicines → Cart → Checkout
  → Nearest destination warehouse resolved via GPS / district name
  → Per-seller sub-orders created
  → Per-seller shipment legs created (originWH = seller's nearest WH, destWH = customer's nearest WH)
  → Wallet / SSLCommerz payment processed
```

### 2. Same-Warehouse (Fast Path)
```
originWH === destWH
  → Leg status: AWAITING_ORIGIN_WH
  → Warehouse receives from seller → status: AT_DEST_WH (direct skip)
  → FulfillmentTask created immediately
  → Proceeds to Pick & Pack
```

### 3. Multi-Warehouse (Transit Path)
```
originWH ≠ destWH
  → Leg: AWAITING_ORIGIN_WH → AT_ORIGIN_WH → IN_TRANSIT → AT_DEST_WH
  → FulfillmentTask created when first leg arrives
  → Workers stage packages as each seller's leg arrives
```

---

## Warehouse Fulfillment Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│                   Warehouse Fulfillment Pipeline                     │
│                                                                      │
│  [/routing]                                                          │
│  Seller ships ──► Confirm Receipt (origin WH)                       │
│                         │                                            │
│                   Same WH? ──Yes──► AT_DEST_WH (skip transit)       │
│                         │No                                          │
│                   Dispatch to dest WH                                │
│                         │                                            │
│                   Confirm Arrival at dest WH                         │
│                         │                                            │
│                   AT_DEST_WH + FulfillmentTask created               │
│                                                                      │
│  [/packing]                                                          │
│  Mark each seller's package RECEIVED (per leg)                       │
│  All legs received? ──► Create Packing Slip (PICKED)                │
│                         │                                            │
│  [/dispatch]                                                         │
│  PACKED ──► Dispatch to Customer (DISPATCHED)                        │
│             ──► Customer Receives → DELIVERED                        │
│                     │                                                │
│               Auto-credit each seller wallet                         │
│                                                                      │
│  [/fulfillment]  (history archive)                                   │
│  Read-only log of all DELIVERED orders + timeline                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Fulfillment Status Transitions

```
PENDING → CONSOLIDATING → PICKED → PACKED → DISPATCHED → DELIVERED
```

### Shipment Leg Status Transitions

```
SELLER_PREPARING → AWAITING_ORIGIN_WH → AT_ORIGIN_WH → IN_TRANSIT → AT_DEST_WH
                                              ↑ same-WH shortcut ──────────────┘
```

---

## Module Reference

### 🛒 Commerce Core
| Module          | Path                       | Purpose                                      |
|-----------------|----------------------------|----------------------------------------------|
| `auth`          | `/api/auth`                | Session-based auth via Better Auth           |
| `orders`        | `/api/orders`              | Order creation, GPS warehouse resolution     |
| `cart`          | `/api/cart`                | Shopping cart management                     |
| `medicines`     | `/api/medicines`           | Listings, stock, CRUD                        |
| `seller`        | `/api/seller`              | Seller dashboard, revenue, analytics         |
| `subOrder`      | `/api/sub-orders`          | Per-seller order slices                      |
| `payment`       | `/api/payments`            | SSLCommerz integration                       |
| `wallet`        | `/api/wallet`              | Balance, transactions, credits               |
| `coupon`        | `/api/coupons`             | Discount code engine                         |
| `flashSale`     | `/api/flash-sales`         | Time-limited sale pricing                    |
| `prescription`  | `/api/prescriptions`       | Upload & verification                        |
| `return`        | `/api/returns`             | Return request workflow                      |
| `wishlist`      | `/api/wishlist`            | Customer wishlist                            |
| `search`        | `/api/search`              | Medicine full-text search                    |

### 🏭 Warehouse Management System (WMS)
| Module               | Path                       | Purpose                                    |
|----------------------|----------------------------|--------------------------------------------|
| `warehouse`          | `/api/warehouses`          | Warehouse CRUD, manager assignment         |
| `shipmentLeg`        | `/api/shipment-legs`       | Inter-warehouse routing, same-WH detection |
| `fulfillment`        | `/api/fulfillment`         | Pack/dispatch/deliver lifecycle            |
| `grn`                | `/api/grn`                 | Goods Receipt Notes from suppliers         |
| `stockTransfer`      | `/api/stock-transfers`     | Intra-warehouse stock movement             |
| `storageBin`         | `/api/storage-bins`        | Bin allocation and location management     |
| `supplier`           | `/api/suppliers`           | Supplier records and shipments             |
| `expiryAlert`        | `/api/expiry-alerts`       | Medicine expiry monitoring                 |
| `temperatureLog`     | `/api/temperature-logs`    | Cold chain compliance logging              |
| `warehouseAnalytics` | `/api/warehouse-analytics` | Operational KPI dashboard                  |
| `medicineBatch`      | `/api/batches`             | Batch/lot tracking                         |
| `stockAlert`         | `/api/stock-alerts`        | Low-stock notifications                    |

### 📣 CMS & Engagement
| Module            | Path                    | Purpose                          |
|-------------------|-------------------------|----------------------------------|
| `banner`          | `/api/banners`          | Homepage hero banners            |
| `blog`            | `/api/blogs`            | Health articles                  |
| `testimonial`     | `/api/testimonials`     | Customer reviews display         |
| `platformFeature` | `/api/platform-features`| Feature highlight cards          |
| `newsletter`      | `/api/newsletter`       | Email subscription               |
| `contact`         | `/api/contact`          | Contact form messages            |
| `chatbot`         | `/api/chatbot`          | AI-powered pharmacy assistant    |
| `notification`    | `/api/notifications`    | In-app alerts                    |
| `sellerLicense`   | `/api/seller-license`   | License upload & admin approval  |
| `subscription`    | `/api/subscriptions`    | Premium plan management          |
| `profile`         | `/api/profile`          | Unified user profile endpoint    |
| `admin`           | `/api/admin`            | Admin controls & analytics       |
| `dashboard`       | `/api/dashboard`        | Role-based dashboard stats       |

---

## API Endpoints

### Authentication
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/sign-up`   | Register a new user      |
| POST   | `/api/auth/sign-in`   | Login                    |
| POST   | `/api/auth/sign-out`  | Logout                   |
| GET    | `/api/auth/session`   | Get current session      |

### Orders
| Method | Endpoint                     | Description                  |
|--------|------------------------------|------------------------------|
| POST   | `/api/orders`                | Place order (GPS routing)    |
| GET    | `/api/orders/my`             | Customer's orders            |
| GET    | `/api/orders/:id`            | Order detail                 |
| PATCH  | `/api/orders/:id/cancel`     | Cancel order                 |

### Fulfillment
| Method | Endpoint                                    | Description                    |
|--------|---------------------------------------------|--------------------------------|
| GET    | `/api/fulfillment/my-queue`                 | Warehouse's fulfillment queue  |
| PATCH  | `/api/fulfillment/:id/receive-item`         | Mark seller package received   |
| PATCH  | `/api/fulfillment/:id/pack`                 | Create packing slip            |
| PATCH  | `/api/fulfillment/:id/dispatch`             | Dispatch to customer           |
| PATCH  | `/api/fulfillment/:id/deliver`              | Confirm delivery + pay sellers |

### Shipment Legs
| Method | Endpoint                                        | Description                       |
|--------|-------------------------------------------------|-----------------------------------|
| GET    | `/api/shipment-legs/mine`                       | Legs for this warehouse           |
| PATCH  | `/api/shipment-legs/:id/receive-at-origin`      | Receive from seller (same-WH skip)|
| PATCH  | `/api/shipment-legs/:id/dispatch`               | Dispatch to dest WH               |
| PATCH  | `/api/shipment-legs/:id/receive-at-dest`        | Confirm arrival at dest WH        |

---

## Data Models

### Key Relationships

```
User (CUSTOMER/SELLER/ADMIN/WAREHOUSE)
 └── Order
      ├── OrderItem (medicine, qty, price)
      ├── SubOrder (per seller)
      │    ├── ShipmentLeg (originWH → destWH)
      │    └── OrderItem (scoped to seller)
      ├── FulfillmentTask (warehouse pack/dispatch lifecycle)
      │    └── PackingSlip
      └── OrderTracking (status audit trail)

Medicine
 ├── MedicineBatch (lot/expiry tracking)
 ├── FlashSale
 ├── StockAlert
 └── Review

Warehouse
 ├── StorageBin → BinAllocation
 ├── WarehouseLocation → LocationStock
 ├── GoodsReceiptNote → GRNItem
 ├── StockTransfer → StockTransferItem
 ├── TemperatureLog
 └── ExpiryAlert

Wallet
 ├── WalletTransaction
 └── WithdrawalRequest
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database
- Cloudinary account (for image/PDF uploads)
- SSLCommerz merchant account (for payments)
- Google Gemini API key (for chatbot)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mediStore_backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

### Development Scripts

```bash
npm run dev       # Start with ts-node-dev (hot reload)
npm run build     # Compile TypeScript to dist/
npm run start     # Run compiled output
npm run seed      # Seed initial data
```

### Utility Scripts

```bash
# Clear all transactional data (keep users + medicines)
npx ts-node clear-orders.ts

# Count records per model
npx ts-node count.ts
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medistore"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:4000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# SSLCommerz Payment
SSLCOMMERZ_STORE_ID="your-store-id"
SSLCOMMERZ_STORE_PASS="your-store-password"
SSLCOMMERZ_IS_LIVE=false

# Google Gemini AI
GEMINI_API_KEY="your-gemini-key"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@email.com"
SMTP_PASS="your-app-password"

# App
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

---

## Database Management

### Prisma Commands

```bash
npx prisma studio          # Visual database browser
npx prisma migrate dev     # Create and apply migration
npx prisma migrate reset   # Reset database
npx prisma db push         # Push schema without migration history
npx prisma generate        # Regenerate client
```

### Warehouse Setup
1. Create warehouses via `POST /api/warehouses` with `lat`, `lng`, `city`
2. Assign a manager: `PATCH /api/warehouses/:id/assign-manager`
3. Warehouses without `lat/lng` are skipped in geo-resolution (Infinity distance)

---

## Project Structure

```
mediStore_backend/
├── prisma/
│   └── schema.prisma          # 50+ model definitions
├── src/
│   ├── app.ts                 # Express app, CORS, route mounting
│   ├── server.ts              # HTTP server bootstrap
│   ├── config/                # Environment configuration
│   ├── errorHelpers/          # AppError, async wrappers
│   ├── interfaces/            # Shared TypeScript interfaces
│   ├── lib/
│   │   ├── auth.ts            # Better Auth configuration
│   │   ├── prisma.ts          # Prisma client (named export)
│   │   └── cloudinary.ts      # Cloudinary setup
│   ├── middleware/
│   │   ├── globalErrorHandler.ts
│   │   ├── authMiddleware.ts  # Session validation
│   │   └── roleGuard.ts       # Role-based access
│   ├── module/                # 39 feature modules
│   │   ├── orders/            # GPS warehouse routing, order creation
│   │   ├── fulfillment/       # Pack → dispatch → deliver lifecycle
│   │   ├── shipmentLeg/       # Inter-warehouse routing + same-WH detection
│   │   ├── warehouse/         # WH CRUD, manager assignment
│   │   └── ...
│   ├── utils/
│   │   ├── bdGeo.ts           # Bangladesh GPS ↔ district/division lookup
│   │   └── haversine.ts       # Great-circle distance
│   └── template/              # Email templates
├── clear-orders.ts            # Bulk data reset utility
├── count.ts                   # Record count utility
└── package.json
```

---

## Geographic Warehouse Resolution

The `nearestWarehouse()` function in `order.service.ts` resolves the correct warehouse using:

1. **GPS pattern first** — Detects `GPS(lat,lng)` embedded in customer address via regex (avoids comma-split bug)
2. **District/division fallback** — Parses Bangladesh district and division names from address tokens
3. **Haversine distance** — Calculates great-circle distance to all active warehouses
4. **Null-safe** — Warehouses missing `lat/lng` receive `Infinity` distance (never selected unless all warehouses lack coordinates)
5. **First-warehouse fallback** — Used only if no coordinates can be resolved at all

> **Coverage:** 8 divisions + 64 districts + common alternate spellings (e.g., Barisal/Barishal, Cumilla/Comilla)

---

## License

MIT © MediStore Team
