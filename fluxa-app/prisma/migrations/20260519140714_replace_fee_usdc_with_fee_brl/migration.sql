/*
  Warnings:

  - You are about to drop the column `fee_usdc` on the `charges` table. All the data in the column will be lost.
  - Added the required column `fee_brl` to the `charges` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "charges" DROP COLUMN "fee_usdc",
ADD COLUMN     "fee_brl" DECIMAL(15,2) NOT NULL;
