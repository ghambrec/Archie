-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PRIVATE', 'ORGANIZATION', 'CUSTOM');

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "ai_summary" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'ORGANIZATION',
    "language" VARCHAR(8),
    "document_date" DATE,
    "bucket" VARCHAR(63) NOT NULL,
    "object_key" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" CHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_documents_org" ON "documents"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_documents_uploaded_by" ON "documents"("uploaded_by", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_documents_status" ON "documents"("status");

-- CreateIndex
CREATE INDEX "idx_documents_visibility" ON "documents"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "uq_documents_bucket_object" ON "documents"("bucket", "object_key");

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" varchar