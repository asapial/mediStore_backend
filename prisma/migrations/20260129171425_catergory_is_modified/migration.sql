/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Medicine" DROP CONSTRAINT "Medicine_categoryId_fkey";

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "category" TEXT[];

-- DropTable
DROP TABLE "Category";
