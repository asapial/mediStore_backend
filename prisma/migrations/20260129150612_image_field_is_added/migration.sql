-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
