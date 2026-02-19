-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SELL', 'BUY', 'FREE', 'EXCHANGE', 'AUCTION');

-- CreateEnum
CREATE TYPE "DurationType" AS ENUM ('TWOWEEKS', 'ONEMONTH', 'TWOMONTHS');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('TOOLS', 'MATERIALS', 'FURNITURE', 'ELECTRONICS', 'COOKING', 'AUTO', 'SPORT', 'ROBOT', 'HANDMADE', 'STOLAR', 'HAMMER', 'OTHER');

-- CreateTable
CREATE TABLE "market_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "priceValue" INTEGER,
    "location" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "type" "ItemType" NOT NULL,
    "imageUrl" TEXT,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "expirationDate" TIMESTAMP(3),
    "duration" "DurationType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "contacts" INTEGER NOT NULL DEFAULT 0,
    "category" "ItemCategory",
    "categoryId" TEXT,

    CONSTRAINT "market_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_messages" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "contactMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_categories_name_key" ON "market_categories"("name");

-- AddForeignKey
ALTER TABLE "market_items" ADD CONSTRAINT "market_items_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_items" ADD CONSTRAINT "market_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "market_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_messages" ADD CONSTRAINT "market_messages_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "market_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_messages" ADD CONSTRAINT "market_messages_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_messages" ADD CONSTRAINT "market_messages_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
