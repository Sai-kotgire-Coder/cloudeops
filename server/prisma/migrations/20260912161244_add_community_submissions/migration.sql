-- CreateTable
CREATE TABLE "community_submissions" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "external_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "review_note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_submissions_author_id_idx" ON "community_submissions"("author_id");

-- CreateIndex
CREATE INDEX "community_submissions_status_idx" ON "community_submissions"("status");

-- AddForeignKey
ALTER TABLE "community_submissions" ADD CONSTRAINT "community_submissions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_submissions" ADD CONSTRAINT "community_submissions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

