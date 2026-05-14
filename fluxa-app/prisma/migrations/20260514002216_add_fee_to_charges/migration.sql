-- AlterTable
ALTER TABLE "charges" ADD COLUMN     "fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "fee_usdc" DECIMAL(18,7);
