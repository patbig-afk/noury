-- Nature de la dépense : partagée 70/30 (achat, travaux) ou courante (non partagée).
CREATE TYPE "ExpenseKind" AS ENUM ('SHARED', 'CURRENT');
ALTER TABLE "Expense" ADD COLUMN "kind" "ExpenseKind" NOT NULL DEFAULT 'SHARED';
