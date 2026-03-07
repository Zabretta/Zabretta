/*
  Warnings:

  - A unique constraint covering the columns `[from_user_id,library_item_id]` on the table `praises` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TargetType" ADD VALUE 'LIBRARY_SECTION';
ALTER TYPE "TargetType" ADD VALUE 'LIBRARY_SUBSECTION';
ALTER TYPE "TargetType" ADD VALUE 'LIBRARY_ITEM';

-- AlterTable
ALTER TABLE "praises" ADD COLUMN     "library_item_id" TEXT;

-- CreateTable
CREATE TABLE "library_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "words" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allowedTypes" TEXT[],
    "fileExtensions" TEXT[],
    "maxFileSize" INTEGER,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "library_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_subsections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "library_subsections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "fileUrl" TEXT,
    "thumbnail" TEXT,
    "url" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "sectionId" TEXT NOT NULL,
    "subsectionId" TEXT NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "library_sections_createdBy_idx" ON "library_sections"("createdBy");

-- CreateIndex
CREATE INDEX "library_sections_isDeleted_idx" ON "library_sections"("isDeleted");

-- CreateIndex
CREATE INDEX "library_subsections_sectionId_idx" ON "library_subsections"("sectionId");

-- CreateIndex
CREATE INDEX "library_subsections_createdBy_idx" ON "library_subsections"("createdBy");

-- CreateIndex
CREATE INDEX "library_subsections_isDeleted_idx" ON "library_subsections"("isDeleted");

-- CreateIndex
CREATE INDEX "library_items_sectionId_idx" ON "library_items"("sectionId");

-- CreateIndex
CREATE INDEX "library_items_subsectionId_idx" ON "library_items"("subsectionId");

-- CreateIndex
CREATE INDEX "library_items_createdBy_idx" ON "library_items"("createdBy");

-- CreateIndex
CREATE INDEX "library_items_type_idx" ON "library_items"("type");

-- CreateIndex
CREATE INDEX "library_items_date_idx" ON "library_items"("date");

-- CreateIndex
CREATE INDEX "library_items_isDeleted_idx" ON "library_items"("isDeleted");

-- CreateIndex
CREATE INDEX "praises_library_item_id_idx" ON "praises"("library_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "praises_from_user_id_library_item_id_key" ON "praises"("from_user_id", "library_item_id");

-- AddForeignKey
ALTER TABLE "praises" ADD CONSTRAINT "praises_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_sections" ADD CONSTRAINT "library_sections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_sections" ADD CONSTRAINT "library_sections_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_sections" ADD CONSTRAINT "library_sections_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_subsections" ADD CONSTRAINT "library_subsections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "library_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_subsections" ADD CONSTRAINT "library_subsections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_subsections" ADD CONSTRAINT "library_subsections_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_subsections" ADD CONSTRAINT "library_subsections_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "library_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "library_subsections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
