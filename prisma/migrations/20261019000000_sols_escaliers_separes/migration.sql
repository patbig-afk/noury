-- Sépare le poste « Sols + escaliers » (29 450 €) en « Sols » (10 000 €) et « Escaliers » (15 000 €),
-- montants donnés par Patrick le 19/10/2026. Escaliers s'insère juste après Sols.
UPDATE "BudgetLine" SET "position" = "position" + 1 WHERE "position" > 9;
UPDATE "BudgetLine" SET "name" = 'Sols', "amount" = 10000, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'bud_sols';
INSERT INTO "BudgetLine" ("id", "name", "position", "amount") VALUES
  ('bud_escaliers', 'Escaliers', 10, 15000)
ON CONFLICT ("name") DO NOTHING;
