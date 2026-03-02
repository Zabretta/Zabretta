-- CreateEnum
CREATE TYPE "PraiseType" AS ENUM ('GREAT', 'EXCELLENT', 'MASTER', 'INSPIRING', 'CREATIVE', 'DETAILED', 'HELPFUL', 'THANKS');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "praisesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "praises" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "praise_type" "PraiseType" NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "praises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "praises_from_user_id_idx" ON "praises"("from_user_id");

-- CreateIndex
CREATE INDEX "praises_to_user_id_idx" ON "praises"("to_user_id");

-- CreateIndex
CREATE INDEX "praises_content_id_idx" ON "praises"("content_id");

-- CreateIndex
CREATE INDEX "praises_created_at_idx" ON "praises"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "praises_from_user_id_content_id_key" ON "praises"("from_user_id", "content_id");

-- AddForeignKey
ALTER TABLE "praises" ADD CONSTRAINT "praises_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "praises" ADD CONSTRAINT "praises_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "praises" ADD CONSTRAINT "praises_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
