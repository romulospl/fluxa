-- CreateTable
CREATE TABLE "charge_transactions" (
    "id" UUID NOT NULL,
    "charge_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "hash" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "charge_transactions" ADD CONSTRAINT "charge_transactions_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
