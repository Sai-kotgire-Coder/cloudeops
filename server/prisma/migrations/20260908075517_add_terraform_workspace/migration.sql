-- CreateTable
CREATE TABLE "terraform_workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_count" INTEGER NOT NULL DEFAULT 0,
    "applied_count" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "state" JSONB,
    "history" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terraform_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terraform_workspaces_user_id_idx" ON "terraform_workspaces"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "terraform_workspaces_user_id_key" ON "terraform_workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "terraform_workspaces" ADD CONSTRAINT "terraform_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
