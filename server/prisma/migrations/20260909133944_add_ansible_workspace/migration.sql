-- CreateTable
CREATE TABLE "ansible_workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_count" INTEGER NOT NULL DEFAULT 0,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "inventory" JSONB,
    "playbook" JSONB,
    "host_state" JSONB,
    "history" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ansible_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ansible_workspaces_user_id_idx" ON "ansible_workspaces"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ansible_workspaces_user_id_key" ON "ansible_workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "ansible_workspaces" ADD CONSTRAINT "ansible_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
