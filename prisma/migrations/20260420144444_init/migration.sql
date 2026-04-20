-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'team', 'viewer');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'team',
    "assigned_client_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "business_name" TEXT,
    "niche" TEXT,
    "target_audience" TEXT,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content_pillars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tone" TEXT,
    "goals" TEXT,
    "avoid" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "retainer_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'green',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "due_date" DATE,
    "tag" TEXT,
    "client_id" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "source_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "platform" TEXT,
    "niche" TEXT,
    "deal_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'Identified',
    "stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_follow_up" DATE,
    "next_action" TEXT,
    "lead_source" TEXT,
    "converted_client_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_notes" (
    "id" SERIAL NOT NULL,
    "prospect_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT,
    "format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Briefed',
    "scheduled_date" DATE,
    "script" TEXT,
    "notes" TEXT,
    "post_link" TEXT,
    "perf_views" INTEGER,
    "perf_likes" INTEGER,
    "perf_comments" INTEGER,
    "perf_saves" INTEGER,
    "assignee_id" UUID,
    "due_date" DATE,
    "in_production" BOOLEAN NOT NULL DEFAULT true,
    "production_stage" TEXT NOT NULL DEFAULT 'Brief',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issue_date" DATE,
    "due_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "payment_method" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "tasks_client_id_idx" ON "tasks"("client_id");

-- CreateIndex
CREATE INDEX "tasks_source_source_ref_idx" ON "tasks"("source", "source_ref");

-- CreateIndex
CREATE INDEX "prospect_notes_prospect_id_idx" ON "prospect_notes"("prospect_id");

-- CreateIndex
CREATE INDEX "content_items_client_id_idx" ON "content_items"("client_id");

-- CreateIndex
CREATE INDEX "content_items_assignee_id_idx" ON "content_items"("assignee_id");

-- CreateIndex
CREATE INDEX "resources_client_id_idx" ON "resources"("client_id");

-- CreateIndex
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_converted_client_id_fkey" FOREIGN KEY ("converted_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_notes" ADD CONSTRAINT "prospect_notes_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
