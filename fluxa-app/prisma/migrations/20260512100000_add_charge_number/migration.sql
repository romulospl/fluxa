-- Adiciona a coluna com default temporário para permitir o backfill
ALTER TABLE "charges" ADD COLUMN "number" INTEGER NOT NULL DEFAULT 0;

-- Backfill: atribui número sequencial por usuário ordenado por data de criação
UPDATE "charges" c
SET "number" = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS row_num
  FROM "charges"
) sub
WHERE c.id = sub.id;

-- Remove o default após o backfill
ALTER TABLE "charges" ALTER COLUMN "number" DROP DEFAULT;

-- Unique por usuário
ALTER TABLE "charges" ADD CONSTRAINT "charges_user_id_number_key" UNIQUE ("user_id", "number");
