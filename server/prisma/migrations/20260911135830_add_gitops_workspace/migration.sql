-- CreateTable
CREATE TABLE "gitops_workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "commit_count" INTEGER NOT NULL DEFAULT 0,
    "sync_count" INTEGER NOT NULL DEFAULT 0,
    "apps" JSONB,
    "commits" JSONB,
    "history" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gitops_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gitops_workspaces_user_id_idx" ON "gitops_workspaces"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gitops_workspaces_user_id_key" ON "gitops_workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "gitops_workspaces" ADD CONSTRAINT "gitops_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
