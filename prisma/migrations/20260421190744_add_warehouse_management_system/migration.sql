-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PICKED', 'PACKED', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'WAREHOUSE';

-- CreateTable
CREATE TABLE "warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "managerId" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_location" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "aisle" TEXT NOT NULL,
    "shelf" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_stock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_bin" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "binCode" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentLoad" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_bin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bin_allocation" (
    "id" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bin_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer" (
    "id" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_item" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "stock_transfer_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_note" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "receivedById" TEXT NOT NULL,
    "status" "GRNStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_item" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "expectedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "grn_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_task" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "packedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_slip" (
    "id" TEXT NOT NULL,
    "fulfillmentTaskId" TEXT NOT NULL,
    "packedBy" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_slip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expiry_alert" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "daysLeft" INTEGER NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expiry_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_shipment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'EXPECTED',
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "trackingNum" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_log" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "minAllowed" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "maxAllowed" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "isAlert" BOOLEAN NOT NULL DEFAULT false,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_location_warehouseId_zone_aisle_shelf_key" ON "warehouse_location"("warehouseId", "zone", "aisle", "shelf");

-- CreateIndex
CREATE UNIQUE INDEX "location_stock_warehouseId_medicineId_key" ON "location_stock"("warehouseId", "medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "storage_bin_warehouseId_binCode_key" ON "storage_bin"("warehouseId", "binCode");

-- CreateIndex
CREATE UNIQUE INDEX "bin_allocation_binId_medicineId_key" ON "bin_allocation"("binId", "medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "fulfillment_task_orderId_key" ON "fulfillment_task"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "packing_slip_fulfillmentTaskId_key" ON "packing_slip"("fulfillmentTaskId");

-- AddForeignKey
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_location" ADD CONSTRAINT "warehouse_location_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_stock" ADD CONSTRAINT "location_stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_stock" ADD CONSTRAINT "location_stock_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_bin" ADD CONSTRAINT "storage_bin_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_bin" ADD CONSTRAINT "storage_bin_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "warehouse_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_allocation" ADD CONSTRAINT "bin_allocation_binId_fkey" FOREIGN KEY ("binId") REFERENCES "storage_bin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bin_allocation" ADD CONSTRAINT "bin_allocation_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_note" ADD CONSTRAINT "goods_receipt_note_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_note" ADD CONSTRAINT "goods_receipt_note_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_note" ADD CONSTRAINT "goods_receipt_note_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "supplier_shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_note" ADD CONSTRAINT "goods_receipt_note_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_item" ADD CONSTRAINT "grn_item_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_item" ADD CONSTRAINT "grn_item_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_task" ADD CONSTRAINT "fulfillment_task_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_task" ADD CONSTRAINT "fulfillment_task_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_task" ADD CONSTRAINT "fulfillment_task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_slip" ADD CONSTRAINT "packing_slip_fulfillmentTaskId_fkey" FOREIGN KEY ("fulfillmentTaskId") REFERENCES "fulfillment_task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expiry_alert" ADD CONSTRAINT "expiry_alert_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expiry_alert" ADD CONSTRAINT "expiry_alert_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_shipment" ADD CONSTRAINT "supplier_shipment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_shipment" ADD CONSTRAINT "supplier_shipment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_log" ADD CONSTRAINT "temperature_log_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_log" ADD CONSTRAINT "temperature_log_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
