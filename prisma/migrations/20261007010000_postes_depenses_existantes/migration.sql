-- Rattache les dépenses déjà saisies à leur poste du budget travaux (validé avec Patrick le 07/10/2026).
-- Seules les dépenses encore sans poste sont touchées ; les versements au notaire restent hors budget.

-- ALCA Maçonnerie (devis DEV-2026/04-1406 : ouvertures murs porteurs, baie, reprises sous-sol) :
-- acompte 30 % + factures de situation
UPDATE "Expense" SET "budgetLineId" = 'bud_gros_oeuvre'
WHERE "budgetLineId" IS NULL AND "supplier" ILIKE 'alca%';

-- Alliance Pro Renov, acompte du devis DEV00000378 « Toiture + bardage »
UPDATE "Expense" SET "budgetLineId" = 'bud_couverture'
WHERE "budgetLineId" IS NULL AND "supplier" ILIKE 'alliance%' AND "amount" = 11000.00;

-- Alliance Pro Renov, acompte du devis DEV00000399 (plâtrerie / isolation pour l'essentiel)
UPDATE "Expense" SET "budgetLineId" = 'bud_isolation'
WHERE "budgetLineId" IS NULL AND "supplier" ILIKE 'alliance%' AND "amount" = 12199.04;
