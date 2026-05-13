-- AlterTable
ALTER TABLE "charge_transactions" ADD COLUMN     "amount_brl" DECIMAL(15,2),
ADD COLUMN     "amount_usdc" DECIMAL(18,7);
