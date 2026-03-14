-- CreateTable
CREATE TABLE "item_views" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_views_itemId_idx" ON "item_views"("itemId");

-- CreateIndex
CREATE INDEX "item_views_userId_idx" ON "item_views"("userId");

-- CreateIndex
CREATE INDEX "item_views_viewedAt_idx" ON "item_views"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "item_views_itemId_userId_key" ON "item_views"("itemId", "userId");

-- AddForeignKey
ALTER TABLE "item_views" ADD CONSTRAINT "item_views_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "market_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_views" ADD CONSTRAINT "item_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
