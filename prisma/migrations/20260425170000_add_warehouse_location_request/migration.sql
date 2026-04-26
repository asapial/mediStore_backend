-- CreateEnum
CREATE TYPE "LocationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "warehouse_location_request" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "note" TEXT,
    "status" "LocationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_location_request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "warehouse_location_request" ADD CONSTRAINT "warehouse_location_request_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_location_request" ADD CONSTRAINT "warehouse_location_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_location_request" ADD CONSTRAINT "warehouse_location_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
