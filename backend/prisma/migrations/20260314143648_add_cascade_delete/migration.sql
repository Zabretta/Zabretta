/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `market_items` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `market_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "library_items" DROP CONSTRAINT "library_items_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "library_items" DROP CONSTRAINT "library_items_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "library_items" DROP CONSTRAINT "library_items_subsectionId_fkey";

-- DropForeignKey
ALTER TABLE "library_sections" DROP CONSTRAINT "library_sections_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "library_subsections" DROP CONSTRAINT "library_subsections_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "market_messages" DROP CONSTRAINT "market_messages_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "market_messages" DROP CONSTRAINT "market_messages_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "praises" DROP CONSTRAINT "praises_content_id_fkey";

-- DropForeignKey
ALTER TABLE "praises" DROP CONSTRAINT "praises_library_item_id_fkey";

-- AlterTable
ALTER TABLE "market_items" DROP COLUMN "deletedAt",
DROP COLUMN "isDeleted";

-- AddForeignKey
ALTER TABLE "praises" ADD CONSTRAINT "praises_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "praises" ADD CONSTRAINT "praises_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_sections" ADD CONSTRAINT "library_sections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_subsections" ADD CONSTRAINT "library_subsections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "library_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "library_subsections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_messages" ADD CONSTRAINT "market_messages_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_messages" ADD CONSTRAINT "market_messages_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
