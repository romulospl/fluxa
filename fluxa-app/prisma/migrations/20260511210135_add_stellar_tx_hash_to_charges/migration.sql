-- AlterTable
ALTER TABLE "charges" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "stellar_tx_hash" TEXT;
