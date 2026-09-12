-- CreateTable
CREATE TABLE "monitoring_workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "panel_count" INTEGER NOT NULL DEFAULT 0,
    "rule_count" INTEGER NOT NULL DEFAULT 0,
    "panels" JSONB,
    "rules" JSONB,
    "history" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monitoring_workspaces_user_id_idx" ON "monitoring_workspaces"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_workspaces_user_id_key" ON "monitoring_workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "monitoring_workspaces" ADD CONSTRAINT "monitoring_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

