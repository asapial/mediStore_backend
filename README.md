<p align="center">
  <h1 align="center">💊 MediStore Backend API</h1>
  <p align="center">
    A robust, production-ready RESTful API for an online medicine e-commerce platform.<br/>
    Built with <strong>Express 5</strong>, <strong>TypeScript</strong>, <strong>Prisma 7</strong>, and <strong>PostgreSQL</strong>.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
  - [Health & Root](#health--root)
  - [Authentication](#authentication)
  - [Medicines (Public)](#medicines-public)
  - [Cart](#cart)
  - [Orders (Customer)](#orders-customer)
  - [Seller Dashboard](#seller-dashboard)
  - [Admin Panel](#admin-panel)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Error Handling](#-error-handling)
- [License](#-license)

---

## 🌟 Overview

**MediStore Backend** is the server-side component of a full-stack online pharmacy / medicine e-commerce platform. It provides a complete set of APIs for managing medicines, shopping carts, orders, and users with a **role-based access control** system supporting three distinct roles:

| Role         | Capabilities                                                                 |
|--------------|------------------------------------------------------------------------------|
| **Customer** | Browse medicines, manage cart, place & track orders, update profile           |
| **Seller**   | List/manage own medicines, view & update order statuses, access sales stats   |
| **Admin**    | Manage all users (ban/unban, role changes), manage categories, view platform-wide stats, view all orders |

**Live API:** `https://medistorebackend-jet.vercel.app`

---

## 🛠 Tech Stack

| Layer              | Technology                                                        |
|--------------------|-------------------------------------------------------------------|
| **Runtime**        | Node.js 20+                                                       |
| **Framework**      | Express.js 5                                                      |
| **Language**       | TypeScript 5.9                                                    |
| **ORM**            | Prisma 7 with `@prisma/adapter-pg` (driver-based adapter)         |
| **Database**       | PostgreSQL (Neon Serverless)                                      |
| **Authentication** | [Better Auth](https://www.better-auth.com/) (session-based, HTTP-only cookies) |
| **Validation**     | Zod 4                                                             |
| **Email**          | Nodemailer (email verification templates)                         |
| **Deployment**     | Vercel (Serverless Functions)                                     |
| **Build Tool**     | tsup (ESM bundle targeting Node 20)                               |

---

## 🏗 Architecture

The project follows a **modular, layered architecture** with clear separation of concerns:

```
Request → CORS → Cookie Parser → Auth Middleware → Route → Controller → Service → Prisma → DB
```

Each feature module is organized with its own:
- **Route** — defines endpoints and applies middleware
- **Controller** — handles HTTP request/response logic
- **Service** — contains business logic and database queries
- **Types** — Zod schemas and TypeScript interfaces

---

## 🗄 Database Schema

The application uses **10 Prisma models** with the following relationships:

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│   User   │────▶│  Medicine  │────▶│   Category   │
│(Customer/│     │            │     │              │
│ Seller/  │     └─────┬──────┘     └──────────────┘
│ Admin)   │           │
└────┬─────┘     ┌─────┴──────┐
     │           │  CartItem   │
     │           └─────┬──────┘
     │           ┌─────┴──────┐
     ├──────────▶│    Cart     │
     │           └────────────┘
     │           ┌────────────┐     ┌──────────────┐
     ├──────────▶│   Order    │────▶│  OrderItem   │
     │           └────────────┘     └──────────────┘
     │           ┌────────────┐
     ├──────────▶│  Review    │
     │           └────────────┘
     │           ┌────────────┐
     ├──────────▶│  Session   │  (Better Auth)
     │           └────────────┘
     │           ┌────────────┐
     ├──────────▶│  Account   │  (Better Auth)
     │           └────────────┘
     │           ┌──────────────┐
     └──────────▶│ Verification │ (Better Auth)
                 └──────────────┘
```

**Enums:**

| Enum          | Values                                              |
|---------------|------------------------------------------------------|
| `Role`        | `CUSTOMER`, `SELLER`, `ADMIN`                        |
| `OrderStatus` | `PLACED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 9.x
- **PostgreSQL** database (or a [Neon](https://neon.tech) serverless instance)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/mediStore_backend.git
cd mediStore_backend

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. Start the development server
npm run dev
```

The server will start at **`http://localhost:5000`**.

### Available Scripts

| Script             | Command                     | Description                              |
|--------------------|-----------------------------|------------------------------------------|
| `npm run dev`      | `npx tsx watch src/server.ts` | Start dev server with hot-reload         |
| `npm run build`    | `prisma generate && tsup ...` | Build production bundle to `api/`        |
| `npm run seeding`  | `npx tsx src/scripts/seedingAdmin.ts` | Seed the database with admin user |
| `npm run dmp`      | `npx prisma migrate dev generate` | Run Prisma migrations              |
| `postinstall`      | `prisma generate`           | Auto-generate Prisma client on install   |

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable             | Description                                          | Example                                  |
|----------------------|------------------------------------------------------|------------------------------------------|
| `DATABASE_URL`       | PostgreSQL connection string                         | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth session signing           | `your_secret_key_here`      |
| `BETTER_AUTH_URL`    | Base URL of the backend application                  | `http://localhost:5000`                   |
| `ORIGIN_URL`         | Frontend application URL (for CORS)                  | `http://localhost:3000`                   |
| `BACKEND_URL`        | Backend URL (used internally)                        | `http://localhost:5000`                   |
| `NODE_ENV`           | Environment mode                                     | `development` or `production`            |
| `PORT`               | Server port (optional, defaults to `5000`)           | `5000`                                   |

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:5000
ORIGIN_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
NODE_ENV=development
```

---

## 📡 API Reference

**Base URL:** `http://localhost:5000` (development) | `https://medistorebackend-jet.vercel.app` (production)

> All protected endpoints require a valid session cookie set via the login endpoint. The authentication middleware validates sessions through Better Auth and enforces role-based access control.

**Auth Legend:**

| Symbol              | Meaning                                                 |
|---------------------|---------------------------------------------------------|
| ❌                  | No authentication required (public)                     |
| ✅ All Roles        | Any authenticated user (Customer, Seller, or Admin)     |
| ✅ Customer         | Only authenticated users with `CUSTOMER` role           |
| ✅ Seller           | Only authenticated users with `SELLER` role             |
| ✅ Admin            | Only authenticated users with `ADMIN` role              |

---

### Health & Root

| Method | Endpoint   | Auth | Description                       |
|--------|------------|------|-----------------------------------|
| `GET`  | `/`        | ❌   | API status & version info         |
| `GET`  | `/health`  | ❌   | Health check with uptime          |

<details>
<summary><strong>GET /</strong> — API Status</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "message": "MediStore API is running 🚀",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```
</details>

<details>
<summary><strong>GET /health</strong> — Health Check</summary>

**Response** `200 OK`
```json
{
  "status": "ok",
  "uptime": 1234.567,
  "timestamp": 1707648000000
}
```
</details>

---

### Authentication

**Prefix:** `/api/auth`

| Method  | Endpoint              | Auth              | Description             |
|---------|-----------------------|-------------------|-------------------------|
| `POST`  | `/api/auth/register`  | ❌                | Register a new user     |
| `POST`  | `/api/auth/login`     | ❌                | Login & receive session |
| `GET`   | `/api/auth/me`        | ✅ All Roles      | Get current user profile|
| `PATCH` | `/api/auth/update`    | ✅ All Roles      | Update user profile     |
| `ALL`   | `/api/auth/*`         | —                 | Better Auth catch-all   |

<details>
<summary><strong>POST /api/auth/register</strong> — Register</summary>

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** `201 Created`
```json
{
  "message": "Registration successful",
  "data": { "user": { ... }, "session": { ... } }
}
```
> Sets `Set-Cookie` header with session cookie.
</details>

<details>
<summary><strong>POST /api/auth/login</strong> — Login</summary>

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  }
}
```
> Sets HTTP-only session cookie via `Set-Cookie` header.
</details>

<details>
<summary><strong>GET /api/auth/me</strong> — Get Current User</summary>

**Headers:** Requires valid session cookie

**Response** `200 OK`
```json
{
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "image": null,
    "role": "CUSTOMER",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```
</details>

<details>
<summary><strong>PATCH /api/auth/update</strong> — Update Profile</summary>

**Headers:** Requires valid session cookie

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "image": "https://example.com/avatar.jpg"
}
```

**Validation:**
- `name` and `email` are required
- `image` is optional (set to `null` if not provided)
- Email uniqueness is checked against other users

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "clx...",
    "name": "John Updated",
    "email": "john.new@example.com",
    "image": "https://example.com/avatar.jpg",
    "role": "CUSTOMER",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
</details>

---

### Medicines (Public)

**Prefix:** `/api/medicines`

| Method | Endpoint                   | Auth         | Description                         |
|--------|----------------------------|--------------|-------------------------------------|
| `GET`  | `/api/medicines`           | ❌           | Get all medicines (with filters)    |
| `GET`  | `/api/medicines/own`       | ✅ Seller    | Get seller's own medicines          |
| `GET`  | `/api/medicines/:id`       | ❌           | Get single medicine by ID           |

<details>
<summary><strong>GET /api/medicines</strong> — List All Medicines</summary>

**Query Parameters (all optional):**

| Parameter    | Type     | Description                     |
|--------------|----------|---------------------------------|
| `categoryId` | `string` | Filter by category ID           |
| `sellerId`   | `string` | Filter by seller ID             |
| `name`       | `string` | Search by name (case-insensitive)|
| `minPrice`   | `number` | Minimum price filter            |
| `maxPrice`   | `number` | Maximum price filter            |

**Response** `200 OK`
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": "clx...",
      "name": "Paracetamol 500mg",
      "description": "Pain reliever and fever reducer",
      "image": "https://...",
      "price": 5.99,
      "stock": 100,
      "manufacturer": "PharmaCorp",
      "category": { "id": "...", "name": "Pain Relief" },
      "seller": { "id": "...", "name": "MedSupply", "email": "..." },
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```
> Results are sorted by `createdAt` in descending order (newest first).
</details>

<details>
<summary><strong>GET /api/medicines/own</strong> — Get Seller's Own Medicines</summary>

**Headers:** Requires valid session cookie (Seller role)

**Response** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "clx...",
      "name": "Paracetamol 500mg",
      "description": "Pain reliever",
      "price": 5.99,
      "stock": 100,
      "manufacturer": "PharmaCorp",
      "category": { "name": "Pain Relief" },
      "seller": { "name": "MedSupply" }
    }
  ]
}
```
</details>

<details>
<summary><strong>GET /api/medicines/:id</strong> — Get Medicine Details</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Paracetamol 500mg",
    "description": "Pain reliever and fever reducer",
    "price": 5.99,
    "stock": 100,
    "manufacturer": "PharmaCorp",
    "category": { "id": "...", "name": "Pain Relief" },
    "seller": { "id": "...", "name": "MedSupply", "email": "..." }
  }
}
```
</details>

---

### Cart

**Prefix:** `/api/cart`

| Method   | Endpoint                           | Auth           | Description                    |
|----------|------------------------------------|----------------|--------------------------------|
| `GET`    | `/api/cart`                        | ✅ Customer    | Get user's cart                |
| `POST`   | `/api/cart/add`                    | ✅ All Roles   | Add item to cart               |
| `GET`    | `/api/cart/status/:medicineId`     | ✅ All Roles   | Check if medicine is in cart   |
| `PATCH`  | `/api/cart/update`                 | ✅ Customer    | Update cart item quantity      |
| `DELETE` | `/api/cart/remove`                 | ✅ Customer    | Remove item from cart          |

<details>
<summary><strong>POST /api/cart/add</strong> — Add to Cart</summary>

**Request Body:**
```json
{
  "medicineId": "clx...",
  "quantity": 2
}
```

**Validation:**
- `medicineId` is required
- `quantity` defaults to `1` if not provided

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": "...",
    "cartId": "...",
    "medicineId": "clx...",
    "quantity": 2
  }
}
```
> If the item already exists in the cart, the quantity is **incremented**. A cart is auto-created for the user if one doesn't exist.
</details>

<details>
<summary><strong>GET /api/cart</strong> — Get Cart</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Cart fetched successfully",
  "data": {
    "items": [
      {
        "id": "...",
        "quantity": 2,
        "medicine": { "name": "...", "price": 5.99, ... }
      }
    ],
    "totalQuantity": 5,
    "totalPrice": 29.95
  }
}
```
> Returns empty cart (`items: [], totalQuantity: 0, totalPrice: 0`) if no cart exists.
</details>

<details>
<summary><strong>GET /api/cart/status/:medicineId</strong> — Check Medicine Cart Status</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "inCart": true,
    "quantity": 3
  }
}
```
> Returns `{ "inCart": false, "quantity": 0 }` if the medicine is not in the user's cart.
</details>

<details>
<summary><strong>PATCH /api/cart/update</strong> — Update Quantity</summary>

**Request Body:**
```json
{
  "itemId": "cart_item_id",
  "quantity": 3
}
```
> Validates against available stock. Minimum quantity is 1.
</details>

<details>
<summary><strong>DELETE /api/cart/remove</strong> — Remove Item</summary>

**Request Body:**
```json
{
  "itemId": "cart_item_id"
}
```
> Verifies cart ownership before deletion.
</details>

---

### Orders (Customer)

**Prefix:** `/api/orders`

| Method   | Endpoint            | Auth         | Description              |
|----------|---------------------|--------------|--------------------------|
| `POST`   | `/api/orders`       | ✅ Customer  | Place a new order        |
| `GET`    | `/api/orders`       | ✅ Customer  | Get all user's orders    |
| `GET`    | `/api/orders/:id`   | ✅ Customer  | Get order details        |
| `DELETE` | `/api/orders/:id`   | ✅ Customer  | Cancel/delete an order   |

<details>
<summary><strong>POST /api/orders</strong> — Create Order</summary>

**Request Body (validated by Zod):**
```json
{
  "address": "123 Main Street, City, Country",
  "items": [
    { "medicineId": "clx...", "quantity": 2 },
    { "medicineId": "clx...", "quantity": 1 }
  ]
}
```

**Validation Rules:**
- `address` — minimum 5 characters
- `items` — at least 1 item required
- `medicineId` — required, non-empty string
- `quantity` — positive integer

**Response** `201 Created`
```json
{
  "message": "Order placed successfully",
  "data": {
    "id": "clx...",
    "userId": "...",
    "address": "123 Main Street, City, Country",
    "status": "PLACED",
    "createdAt": "..."
  }
}
```
> Order creation is wrapped in a **Prisma transaction** to ensure atomicity. Medicine prices are snapshotted at order time. All requested medicine IDs are validated to exist before the order is created.
</details>

<details>
<summary><strong>GET /api/orders</strong> — Get User's Orders</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "message": "User orders fetched successfully",
  "data": [
    {
      "id": "clx...",
      "status": "PLACED",
      "address": "...",
      "createdAt": "...",
      "items": [
        {
          "id": "...",
          "quantity": 2,
          "status": "PLACED",
          "price": 5.99,
          "medicine": {
            "name": "Paracetamol",
            "description": "...",
            "price": 5.99,
            "image": "...",
            "sellerId": "..."
          }
        }
      ]
    }
  ]
}
```
</details>

<details>
<summary><strong>DELETE /api/orders/:id</strong> — Cancel Order</summary>

> Cannot delete orders with status `DELIVERED` or `CANCELLED`.

**Response** `200 OK`
```json
{
  "success": true,
  "data": { "message": "Order deleted successfully" }
}
```
</details>

---

### Seller Dashboard

**Prefix:** `/api/seller`

| Method   | Endpoint                     | Auth         | Description                    |
|----------|------------------------------|--------------|--------------------------------|
| `POST`   | `/api/seller/medicines`      | ✅ Seller    | Add a new medicine             |
| `PUT`    | `/api/seller/medicines/:id`  | ✅ Seller    | Update a medicine              |
| `DELETE` | `/api/seller/medicines/:id`  | ✅ Seller    | Delete a medicine              |
| `GET`    | `/api/seller/orders`         | ✅ Seller    | Get orders containing seller's products |
| `PUT`    | `/api/seller/orders`         | ✅ Seller    | Update order item statuses     |
| `GET`    | `/api/seller/stat`           | ✅ All Roles | Get seller dashboard statistics|

<details>
<summary><strong>POST /api/seller/medicines</strong> — Add Medicine</summary>

**Request Body (validated by Zod):**
```json
{
  "name": "Paracetamol 500mg",
  "description": "Effective pain reliever and fever reducer",
  "image": "https://example.com/medicine.jpg",
  "price": 5.99,
  "stock": 100,
  "manufacturer": "PharmaCorp",
  "categoryId": "clx..."
}
```

**Validation Rules:**
| Field          | Rule                                |
|----------------|-------------------------------------|
| `name`         | min 2 characters                    |
| `description`  | min 5 characters                    |
| `image`        | valid URL (optional, nullable)      |
| `price`        | positive number                     |
| `stock`        | non-negative integer                |
| `manufacturer` | min 2 characters                    |
| `categoryId`   | required string                     |

> The `sellerId` is automatically set from the authenticated user's session.
</details>

<details>
<summary><strong>PUT /api/seller/medicines/:id</strong> — Update Medicine</summary>

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 7.99,
  "stock": 50
}
```
> Only the fields provided in the request body will be updated. Uses partial update logic.
</details>

<details>
<summary><strong>GET /api/seller/orders</strong> — Get Seller's Orders</summary>

**Response** `200 OK`
```json
{
  "status": true,
  "message": "Data fetched successfully",
  "data": [
    {
      "id": "clx...",
      "status": "PLACED",
      "address": "...",
      "createdAt": "...",
      "items": [
        {
          "id": "...",
          "orderId": "...",
          "medicineId": "...",
          "quantity": 2,
          "price": 5.99,
          "status": "PLACED",
          "medicine": { "sellerId": "...", "name": "..." }
        }
      ]
    }
  ]
}
```
> Returns only orders (and their items) that contain medicines belonging to the authenticated seller.
</details>

<details>
<summary><strong>PUT /api/seller/orders</strong> — Update Order Item Status</summary>

**Request Body:**
```json
{
  "orderId": "clx...",
  "orderItemIds": ["item1", "item2"],
  "status": "SHIPPED"
}
```
> When **all items** in an order reach the same status, the parent order status is automatically updated to match.
</details>

<details>
<summary><strong>GET /api/seller/stat</strong> — Seller Statistics</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalMedicines": 15,
    "outOfStockMedicines": 2,
    "lowStockMedicines": 3,
    "averagePrice": 12.50,
    "totalOrders": 45,
    "completedOrders": 30,
    "cancelledOrders": 5,
    "ordersByStatus": [...],
    "totalSold": 150,
    "totalRevenue": 1875.00,
    "averageOrderValue": 41.67,
    "todayRevenue": 125.00,
    "thisMonthRevenue": 650.00
  }
}
```
> Low stock threshold is set at 10 units. Revenue calculations only include items sold by the authenticated seller.
</details>

---

### Admin Panel

**Prefix:** `/api/admin`

| Method  | Endpoint                       | Auth       | Description                |
|---------|--------------------------------|------------|----------------------------|
| `GET`   | `/api/admin/users`             | ✅ Admin   | List all users             |
<!-- | `GET`   | `/api/admin/users/:id`         | ❌         | Get user details + orders  |
| `PUT`   | `/api/admin/users/:id`         | ❌         | Update user profile        | -->
| `PATCH` | `/api/admin/users/:id`         | ✅ Admin   | Update user name/role      |
| `PATCH` | `/api/admin/users/:userId/ban` | ✅ Admin   | Ban or unban a user        |
| `GET`   | `/api/admin/categories`        | ✅ All Roles| List all categories        |
| `PUT`   | `/api/admin/categories/:id`    | ✅ Admin   | Update a category          |
| `GET`   | `/api/admin/stats`             | ✅ Admin   | Platform-wide statistics   |
| `GET`   | `/api/admin/order`             | ✅ Admin   | List all orders            |

<details>
<summary><strong>GET /api/admin/users</strong> — List All Users</summary>

**Response** `200 OK`
```json
{
  "status": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "isBanned": false,
      "createdAt": "..."
    }
  ]
}
```
</details>

<details>
<summary><strong>GET /api/admin/users/:id</strong> — Get User Details</summary>

**Response** `200 OK`
```json
{
  "status": true,
  "message": "User fetched successfully",
  "data": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "isBanned": false,
    "orders": [...]
  }
}
```
> Includes the user's order history.
</details>

<details>
<summary><strong>PATCH /api/admin/users/:id</strong> — Update User Name/Role (Admin)</summary>

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "SELLER"
}
```

> At least one of `name` or `role` must be provided. Valid roles are `CUSTOMER`, `SELLER`, or `ADMIN`.

**Response** `200 OK`
```json
{
  "status": true,
  "message": "User updated successfully",
  "data": {
    "id": "...",
    "name": "Updated Name",
    "email": "...",
    "role": "SELLER",
    "isBanned": false,
    "updatedAt": "..."
  }
}
```
</details>

<details>
<summary><strong>PATCH /api/admin/users/:userId/ban</strong> — Ban/Unban User</summary>

**Request Body:**
```json
{
  "ban": true
}
```
> Only accessible by users with `ADMIN` role. The `ban` field must be a boolean.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "User banned successfully",
  "data": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "CUSTOMER",
    "isBanned": true,
    "updatedAt": "..."
  }
}
```
</details>

<details>
<summary><strong>GET /api/admin/stats</strong> — Platform Statistics</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Admin stats fetched successfully",
  "data": {
    "users": {
      "total": 150,
      "customers": 120,
      "sellers": 25,
      "admins": 5
    },
    "medicines": { "total": 500 },
    "orders": {
      "total": 1200,
      "placed": 100,
      "processing": 50,
      "shipped": 200,
      "delivered": 800,
      "cancelled": 50
    },
    "cart": {
      "totalItems": 300,
      "totalQuantity": 750
    },
    "reviews": {
      "total": 450,
      "averageRating": 4.2
    }
  }
}
```
</details>

<details>
<summary><strong>GET /api/admin/order</strong> — List All Orders</summary>

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Order fetched successfully",
  "data": [
    {
      "id": "clx...",
      "userId": "...",
      "status": "PLACED",
      "address": "...",
      "createdAt": "...",
      "items": [
        {
          "id": "...",
          "medicineId": "...",
          "quantity": 2,
          "status": "PLACED",
          "price": 5.99,
          "medicine": {
            "id": "...",
            "name": "Paracetamol",
            "image": "...",
            "manufacturer": "...",
            "seller": { "id": "...", "name": "...", "image": "..." }
          }
        }
      ]
    }
  ]
}
```
</details>

---

## 📂 Project Structure

```
mediStore_backend/
├── prisma/
│   ├── schema.prisma          # Database schema (10 models, 2 enums)
│   └── migrations/            # Migration history
├── src/
│   ├── app.ts                 # Express app setup, CORS, routes
│   ├── server.ts              # Server entry point, DB connection
│   ├── index.ts               # Module export
│   ├── lib/
│   │   ├── auth.ts            # Better Auth configuration
│   │   └── prisma.ts          # Prisma client with PG adapter
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Session validation & RBAC
│   │   └── globalErrorHadelar.ts  # Centralized Prisma error handler
│   ├── module/
│   │   ├── auth/              # Authentication (register, login, me, update)
│   │   ├── medicine/          # Public medicine listing & search
│   │   ├── cart/              # Shopping cart management
│   │   ├── orders/            # Order placement & tracking
│   │   ├── seller/            # Seller medicine & order management
│   │   ├── admin/             # Admin user/category/stats management
│   │   └── users/             # (Reserved)
│   ├── type/
│   │   └── type.ts            # Role & OrderStatus constants
│   └── utils/
│       └── emailTemplate.ts   # Email verification HTML template
├── generated/                 # Auto-generated Prisma client
├── api/                       # Production build output (Vercel)
├── prisma.config.ts           # Prisma CLI configuration
├── tsconfig.json              # TypeScript configuration
├── vercel.json                # Vercel deployment configuration
├── package.json
├── .env                       # Environment variables (not committed)
└── .gitignore
```

---

## 🚢 Deployment

The project is configured for **Vercel** serverless deployment:

1. **Build** — `npm run build` compiles via `tsup` to `api/server.mjs`
2. **Vercel config** — `vercel.json` routes all requests to the serverless function:
   ```json
   {
     "version": 2,
     "builds": [{ "src": "api/server.mjs", "use": "@vercel/node" }],
     "routes": [{ "src": "/(.*)", "dest": "/api/server.mjs" }]
   }
   ```
3. **Environment variables** — Set all `.env` variables in the Vercel dashboard
4. **CORS** — Pre-configured to allow the following origins:
   - `http://localhost:3000` (local development)
   - `https://medi-store-frontend-khaki.vercel.app`
   - `https://medistorefrontend.vercel.app`
   - Any `*.vercel.app` deployment (via regex pattern)

---

## 🛡 Error Handling

The API uses a **centralized global error handler** that maps Prisma error codes to appropriate HTTP status codes:

| Error Type / Code                     | HTTP Code | Description                              |
|---------------------------------------|-----------|------------------------------------------|
| `PrismaClientValidationError`         | `400`     | Invalid request data                     |
| `P1000`                               | `401`     | Database authentication failed           |
| `P1001` / `P1002` / `P1017`          | `503`     | Database server unreachable              |
| `P1003` / `P1014`                    | `404`     | Database or table not found              |
| `P1013`                               | `400`     | Invalid database connection string       |
| `P2000` / `P2005` / `P2006` / `P2019` / `P2020` | `400` | Invalid data provided            |
| `P2001` / `P2025`                    | `404`     | Record not found                         |
| `P2002`                              | `409`     | Duplicate value (unique constraint)      |
| `P2003`                              | `400`     | Foreign key constraint violation         |
| `P2011` / `P2012` / `P2013`         | `400`     | Missing required field                   |
| `P2021` / `P2022`                    | `404`     | Database table or column not found       |
| `P2024` / `P2037`                    | `503`     | Connection pool exhausted                |
| `P2034`                              | `409`     | Transaction conflict                     |
| `PrismaClientUnknownRequestError`     | `500`     | Unknown database error                   |
| `PrismaClientInitializationError`     | `500`     | Failed to initialize database connection |
| `PrismaClientRustPanicError`          | `500`     | Database engine crashed                  |
| Generic `Error`                       | `500`     | Internal server error                    |

**Standard error response format:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Made with ❤️ by <strong>Md Abu Syeed Abdullah</strong>
</p>
