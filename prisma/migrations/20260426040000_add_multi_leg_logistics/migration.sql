-- Add businessCity to user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "businessCity" TEXT;

-- Add originWarehouseId to sub_order
ALTER TABLE "sub_order" ADD COLUMN IF NOT EXISTS "originWarehouseId" TEXT;

-- Add READY to FulfillmentStatus enum
ALTER TYPE "FulfillmentStatus" ADD VALUE IF NOT EXISTS 'READY';

-- CreateEnum ShipmentLegStatus
DO $$ BEGIN
  CREATE TYPE "ShipmentLegStatus" AS ENUM (
    'SELLER_PREPARING',
    'AWAITING_ORIGIN_WH',
    'AT_ORIGIN_WH',
    'IN_TRANSIT',
    'AT_DEST_WH'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable shipment_leg
CREATE TABLE IF NOT EXISTS "shipment_leg" (
  "id"                TEXT NOT NULL,
  "orderId"           TEXT NOT NULL,
  "subOrderId"        TEXT NOT NULL,
  "originWarehouseId" TEXT NOT NULL,
  "destWarehouseId"   TEXT NOT NULL,
  "status"            "ShipmentLegStatus" NOT NULL DEFAULT 'SELLER_PREPARING',
  "arrivedAtOriginAt" TIMESTAMP(3),
  "dispatchedAt"      TIMESTAMP(3),
  "arrivedAtDestAt"   TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "shipment_leg_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on subOrderId
CREATE UNIQUE INDEX IF NOT EXISTS "shipment_leg_subOrderId_key" ON "shipment_leg"("subOrderId");

-- Foreign keys
ALTER TABLE "shipment_leg" ADD CONSTRAINT "shipment_leg_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipment_leg" ADD CONSTRAINT "shipment_leg_subOrderId_fkey"
  FOREIGN KEY ("subOrderId") REFERENCES "sub_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipment_leg" ADD CONSTRAINT "shipment_leg_originWarehouseId_fkey"
  FOREIGN KEY ("originWarehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipment_leg" ADD CONSTRAINT "shipment_leg_destWarehouseId_fkey"
  FOREIGN KEY ("destWarehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK for sub_order.originWarehouseId
ALTER TABLE "sub_order" ADD CONSTRAINT "sub_order_originWarehouseId_fkey"
  FOREIGN KEY ("originWarehouseId") REFERENCES "warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
