-- AlterTable
ALTER TABLE "community_submissions" ADD COLUMN     "helpful_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_role" TEXT,
ADD COLUMN     "share_token" TEXT;

-- AlterTable
ALTER TABLE "workshop_registrations" ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "submission_helpfuls" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_helpfuls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_comments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_broadcasts" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "recent_days" INTEGER,
    "user_ids" TEXT[],
    "send_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_helpfuls_submission_id_idx" ON "submission_helpfuls"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_helpfuls_submission_id_user_id_key" ON "submission_helpfuls"("submission_id", "user_id");

-- CreateIndex
CREATE INDEX "submission_comments_submission_id_idx" ON "submission_comments"("submission_id");

-- CreateIndex
CREATE INDEX "scheduled_broadcasts_status_send_at_idx" ON "scheduled_broadcasts"("status", "send_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_share_token_key" ON "users"("share_token");

-- CreateIndex
CREATE INDEX "workshop_registrations_user_id_idx" ON "workshop_registrations"("user_id");

-- AddForeignKey
ALTER TABLE "submission_helpfuls" ADD CONSTRAINT "submission_helpfuls_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "community_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_helpfuls" ADD CONSTRAINT "submission_helpfuls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_comments" ADD CONSTRAINT "submission_comments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "community_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_comments" ADD CONSTRAINT "submission_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_broadcasts" ADD CONSTRAINT "scheduled_broadcasts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_registrations" ADD CONSTRAINT "workshop_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

