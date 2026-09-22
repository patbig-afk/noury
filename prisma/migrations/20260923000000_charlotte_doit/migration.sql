-- "Surplus Patrick" devient "ce que Charlotte doit à Patrick" = Patrick a payé − Part Patrick
ALTER TABLE "Expense" RENAME COLUMN "surplusPatrick" TO "owedByCharlotte";
UPDATE "Expense" SET "owedByCharlotte" = "paidPatrick" - "sharePatrick";

-- 2e justificatif (colonne "Justificatif 2" du Google Sheet)
ALTER TABLE "Expense" ADD COLUMN "proof2Path" TEXT,
ADD COLUMN "proof2Name" TEXT;
