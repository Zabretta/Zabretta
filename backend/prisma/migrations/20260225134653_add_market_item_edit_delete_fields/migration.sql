-- AlterTable
ALTER TABLE "market_items" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "editCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);
