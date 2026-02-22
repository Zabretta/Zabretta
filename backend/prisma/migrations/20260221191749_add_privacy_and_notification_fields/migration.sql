-- AlterTable
ALTER TABLE "users" ADD COLUMN     "showCity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhone" BOOLEAN NOT NULL DEFAULT false;
