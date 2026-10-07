-- Postes du budget travaux + rattachement des dépenses à un poste
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetLine_name_key" ON "BudgetLine"("name");

ALTER TABLE "Expense" ADD COLUMN "budgetLineId" TEXT;
CREATE INDEX "Expense_budgetLineId_idx" ON "Expense"("budgetLineId");
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Budget initial : scénario B « Hybride » (cave technique), onglet « Budgets Comparatif simplifié »,
-- avec 3 corrections par rapport au Sheet :
--   • Couverture / zinguerie (31 100 €) ajoutée : elle manquait dans l'onglet simplifié ;
--   • Peinture : la ligne « Murs/plafonds Étage » (7 200 €) n'était pas comptée → 20 300 € ;
--   • Aménagements : sous-total menuiseries intérieures faux (7 000 → 13 000 €) → 29 000 € ;
--   • Réserve aléas = 10 % des postes (le Sheet comptait deux fois gros œuvre et menuiseries).
INSERT INTO "BudgetLine" ("id", "name", "position", "amount") VALUES
  ('bud_gros_oeuvre',    'Gros œuvre / maçonnerie',                    1, 69400),
  ('bud_surelevation',   'Surélévation',                               2, 22660),
  ('bud_couverture',     'Couverture / zinguerie',                     3, 31100),
  ('bud_menuiseries',    'Menuiseries ext. + charpente',               4, 26820),
  ('bud_plomberie',      'Plomberie / sanitaires',                     5, 26800),
  ('bud_electricite',    'Électricité',                                6, 11300),
  ('bud_chauffage',      'Chauffage PAC + VMC',                        7, 20200),
  ('bud_isolation',      'Isolation / plâtrerie',                      8, 28600),
  ('bud_sols',           'Sols + escaliers',                           9, 29450),
  ('bud_peinture',       'Peinture / finitions',                      10, 20300),
  ('bud_cuisine',        'Cuisine équipée',                           11, 10300),
  ('bud_amenagements',   'Aménagements + menuiseries int.',           12, 29000),
  ('bud_nettoyage',      'Nettoyage / évacuation',                    13, 1900),
  ('bud_reserve',        'Réserve aléas (10 %)',                      14, 32783);
