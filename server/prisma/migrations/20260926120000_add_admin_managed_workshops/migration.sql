-- CreateTable
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" TEXT[],
    "location" TEXT NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "daily_count" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workshops_is_published_start_at_idx" ON "workshops"("is_published", "start_at");

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data backfill: this app already ran one hardcoded workshop ("The Other
-- Side of Software", Oct 3-4 2026) before this migration existed, so its
-- existing WorkshopRegistration rows need a real Workshop to point at
-- before workshop_id can be made NOT NULL below. createdById is the
-- earliest admin account (self-hosted convention -- this instance only
-- ever had one admin at the time of this migration).
INSERT INTO "workshops" (
  "id", "title", "summary", "highlights", "location", "is_online",
  "start_at", "end_at", "daily_count", "is_published",
  "created_by_id", "created_at", "updated_at"
) VALUES (
  'ebad67ab-4fc2-4ccb-906a-42ceef3ea727',
  'The Other Side of Software',
  'Every app you use stays online because of people most students never hear about. A hands-on weekend into DevOps & SRE -- and how to actually build a career in it.',
  ARRAY[
    'What DevOps & SRE actually are, beyond the job-title buzzwords',
    'Hands-on time inside CloudOps Simulator, not slides',
    'Career guidance beyond SDE -- mapping paths into DevOps, SRE & platform roles'
  ],
  'https://meet.google.com/zcs-vdnj-nqp',
  true,
  '2026-10-03T10:30:00Z',
  '2026-10-03T12:30:00Z',
  2,
  true,
  (SELECT id FROM "users" WHERE "is_admin" = true ORDER BY "created_at" ASC LIMIT 1),
  now(),
  now()
);

-- AlterTable: add workshop_id nullable first so it can be backfilled below,
-- then tightened to NOT NULL once every existing row has a value.
ALTER TABLE "workshop_registrations" ADD COLUMN     "workshop_id" TEXT;

UPDATE "workshop_registrations" SET "workshop_id" = 'ebad67ab-4fc2-4ccb-906a-42ceef3ea727' WHERE "workshop_id" IS NULL;

ALTER TABLE "workshop_registrations" ALTER COLUMN "workshop_id" SET NOT NULL;

-- DropIndex: the old bare-email uniqueness no longer applies now that
-- registrations are scoped per workshop.
DROP INDEX "workshop_registrations_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "workshop_registrations_workshop_id_email_key" ON "workshop_registrations"("workshop_id", "email");

-- AddForeignKey
ALTER TABLE "workshop_registrations" ADD CONSTRAINT "workshop_registrations_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
