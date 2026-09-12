-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "selected_modules" SET DEFAULT ARRAY['dashboard', 'scenarios', 'applications', 'containers', 'terraform', 'ansible', 'vault', 'kubectl', 'gitops', 'monitoring', 'networking', 'instances', 'cicd', 'live', 'cli', 'tickets', 'issues']::TEXT[];

-- Backfill: existing profiles that already had "everything" selected
-- (the pre-this-feature default) should pick up the new module too,
-- matching this column's stated intent of "everything, already done"
-- for pre-existing accounts. Profiles that deliberately deselected
-- modules are left alone.
UPDATE "user_profiles"
SET "selected_modules" = array_append("selected_modules", 'monitoring')
WHERE NOT ('monitoring' = ANY("selected_modules"))
  AND 'gitops' = ANY("selected_modules");
