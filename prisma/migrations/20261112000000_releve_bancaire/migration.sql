-- Relevé bancaire joint à une dépense
ALTER TABLE "Expense" ADD COLUMN "statementPath" TEXT,
ADD COLUMN "statementName" TEXT;
