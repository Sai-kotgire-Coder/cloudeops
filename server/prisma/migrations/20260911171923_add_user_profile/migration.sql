-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "linkedin_url" TEXT,
    "instagram_handle" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "institute" TEXT,
    "occupation" TEXT,
    "selected_modules" TEXT[] DEFAULT ARRAY['dashboard', 'scenarios', 'applications', 'containers', 'terraform', 'ansible', 'vault', 'kubectl', 'gitops', 'networking', 'instances', 'cicd', 'live', 'cli', 'tickets', 'issues']::TEXT[],
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
