-- Nouveaux postes « Terrasse » (10 000 €) et « Insert » (8 000 €), placés avant la réserve aléas.
UPDATE "BudgetLine" SET "position" = 17 WHERE "id" = 'bud_reserve';
INSERT INTO "BudgetLine" ("id", "name", "position", "amount") VALUES
  ('bud_terrasse', 'Terrasse', 15, 10000),
  ('bud_insert',   'Insert',   16, 8000)
ON CONFLICT ("name") DO NOTHING;
