-- Retour aux montants de l'onglet « Budgets Comparatif simplifié » du Sheet (total 320 821 €),
-- à la demande de Patrick. Le poste Couverture est gardé (il porte l'acompte toiture) mais à 0 €,
-- car il n'existe pas dans l'onglet simplifié.
-- Seuls les montants encore à leur valeur initiale sont modifiés (une saisie faite dans l'app est conservée).
UPDATE "BudgetLine" SET "amount" = 0,     "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'bud_couverture'   AND "amount" = 31100;
UPDATE "BudgetLine" SET "amount" = 13100, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'bud_peinture'     AND "amount" = 20300;
UPDATE "BudgetLine" SET "amount" = 23000, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'bud_amenagements' AND "amount" = 29000;
UPDATE "BudgetLine" SET "amount" = 1440,  "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'bud_nettoyage'    AND "amount" = 1900;
UPDATE "BudgetLine" SET "amount" = 37751, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'bud_reserve'      AND "amount" = 32783;
