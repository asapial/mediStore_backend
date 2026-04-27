-- AlterEnum
ALTER TYPE "FulfillmentStatus" ADD VALUE 'CONSOLIDATING';

-- AlterTable
ALTER TABLE "shipment_leg" ADD COLUMN     "stagedAt" TIMESTAMP(3);
