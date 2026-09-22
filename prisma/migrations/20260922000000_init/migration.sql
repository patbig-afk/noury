-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Payer" AS ENUM ('PATRICK', 'CHARLOTTE', 'BOTH');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidBy" "Payer" NOT NULL,
    "sharePatrick" DECIMAL(12,2) NOT NULL,
    "shareCharlotte" DECIMAL(12,2) NOT NULL,
    "paidPatrick" DECIMAL(12,2) NOT NULL,
    "paidCharlotte" DECIMAL(12,2) NOT NULL,
    "surplusPatrick" DECIMAL(12,2) NOT NULL,
    "invoicePath" TEXT,
    "invoiceName" TEXT,
    "proofPath" TEXT,
    "proofName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Catégories par défaut
INSERT INTO "Category" ("id", "name") VALUES
  ('cat_travaux', 'Travaux / artisans'),
  ('cat_materiaux', 'Matériaux / achats'),
  ('cat_notaire', 'Notaire / achat');
