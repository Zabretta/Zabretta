/*
  Warnings:

  - The `moderationFlags` column on the `market_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ModerationFlag" AS ENUM ('BAD_WORDS', 'SPAM_LINKS', 'ALL_CAPS', 'REPETITIVE_CHARS');

-- AlterTable
ALTER TABLE "market_items" DROP COLUMN "moderationFlags",
ADD COLUMN     "moderationFlags" "ModerationFlag"[] DEFAULT ARRAY[]::"ModerationFlag"[];
