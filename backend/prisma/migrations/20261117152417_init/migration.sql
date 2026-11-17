-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X', 'YOUTUBE', 'GITHUB');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED', 'SPAM');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL DEFAULT 'default',
    "full_name" VARCHAR(120) NOT NULL,
    "professional_title" VARCHAR(120) NOT NULL,
    "company_name" VARCHAR(120),
    "headline" VARCHAR(300) NOT NULL,
    "biography" TEXT NOT NULL,
    "profile_image" VARCHAR(500),
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(30),
    "whatsapp" VARCHAR(30),
    "website" VARCHAR(500),
    "location" VARCHAR(120),
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(600) NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "image" VARCHAR(500),
    "project_url" VARCHAR(500),
    "category" VARCHAR(60) NOT NULL,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role" VARCHAR(120) NOT NULL,
    "organization" VARCHAR(120) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "description" VARCHAR(600),
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualifications" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "institution" VARCHAR(160) NOT NULL,
    "year" SMALLINT,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "author_name" VARCHAR(120) NOT NULL,
    "author_role" VARCHAR(120),
    "author_company" VARCHAR(120),
    "author_image" VARCHAR(500),
    "quote" VARCHAR(1200) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" UUID NOT NULL,
    "profile_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(30),
    "subject" VARCHAR(150) NOT NULL,
    "message" VARCHAR(5000) NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_slug_key" ON "profiles"("slug");

-- CreateIndex
CREATE INDEX "services_profile_id_is_active_display_order_idx" ON "services"("profile_id", "is_active", "display_order");

-- CreateIndex
CREATE INDEX "portfolio_items_profile_id_is_active_display_order_idx" ON "portfolio_items"("profile_id", "is_active", "display_order");

-- CreateIndex
CREATE INDEX "social_links_profile_id_is_active_display_order_idx" ON "social_links"("profile_id", "is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_profile_id_platform_key" ON "social_links"("profile_id", "platform");

-- CreateIndex
CREATE INDEX "experiences_profile_id_display_order_idx" ON "experiences"("profile_id", "display_order");

-- CreateIndex
CREATE INDEX "qualifications_profile_id_display_order_idx" ON "qualifications"("profile_id", "display_order");

-- CreateIndex
CREATE INDEX "testimonials_profile_id_is_active_display_order_idx" ON "testimonials"("profile_id", "is_active", "display_order");

-- CreateIndex
CREATE INDEX "contact_submissions_status_created_at_idx" ON "contact_submissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "contact_submissions_profile_id_created_at_idx" ON "contact_submissions"("profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
