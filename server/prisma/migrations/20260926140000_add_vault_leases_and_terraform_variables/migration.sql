-- AlterTable
ALTER TABLE "terraform_workspaces" ADD COLUMN     "variables" JSONB;

-- AlterTable
ALTER TABLE "vault_workspaces" ADD COLUMN     "leases" JSONB;

