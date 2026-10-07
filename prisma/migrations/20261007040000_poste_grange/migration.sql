-- Nouveau poste « Grange » (10 000 €), placé juste avant la réserve aléas.
UPDATE "BudgetLine" SET "position" = 15 WHERE "id" = 'bud_reserve';
INSERT INTO "BudgetLine" ("id", "name", "position", "amount") VALUES ('bud_grange', 'Grange', 14, 10000)
ON CONFLICT ("name") DO NOTHING;
