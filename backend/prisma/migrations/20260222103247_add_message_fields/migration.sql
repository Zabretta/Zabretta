-- AlterTable
ALTER TABLE "market_messages" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "market_messages_itemId_idx" ON "market_messages"("itemId");

-- CreateIndex
CREATE INDEX "market_messages_fromUserId_idx" ON "market_messages"("fromUserId");

-- CreateIndex
CREATE INDEX "market_messages_toUserId_idx" ON "market_messages"("toUserId");

-- CreateIndex
CREATE INDEX "market_messages_createdAt_idx" ON "market_messages"("createdAt");

-- CreateIndex
CREATE INDEX "market_messages_parentId_idx" ON "market_messages"("parentId");

-- AddForeignKey
ALTER TABLE "market_messages" ADD CONSTRAINT "market_messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "market_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
