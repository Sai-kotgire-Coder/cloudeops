-- CreateTable
CREATE TABLE "vault_workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret_count" INTEGER NOT NULL DEFAULT 0,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "engines" JSONB,
    "secrets" JSONB,
    "policies" JSONB,
    "tokens" JSONB,
    "history" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vault_workspaces_user_id_idx" ON "vault_workspaces"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vault_workspaces_user_id_key" ON "vault_workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "vault_workspaces" ADD CONSTRAINT "vault_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
