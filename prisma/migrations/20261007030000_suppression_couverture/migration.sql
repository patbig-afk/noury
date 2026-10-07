-- Suppression du poste Couverture / zinguerie (absent du Sheet), à la demande de Patrick.
-- Ses dépenses (acompte toiture Alliance de 11 000 €) passent en Surélévation.
UPDATE "Expense" SET "budgetLineId" = 'bud_surelevation' WHERE "budgetLineId" = 'bud_couverture';
DELETE FROM "BudgetLine" WHERE "id" = 'bud_couverture';
