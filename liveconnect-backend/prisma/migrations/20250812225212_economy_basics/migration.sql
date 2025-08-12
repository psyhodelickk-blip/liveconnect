-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('PURCHASE', 'TIP', 'GIFT', 'CALL_MIN', 'REFUND', 'ADJUST');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "TxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCatalog" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftEvent" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "giftId" INTEGER NOT NULL,
    "message" TEXT,
    "coins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoinTransaction_reference_key" ON "CoinTransaction"("reference");

-- CreateIndex
CREATE INDEX "CoinTransaction_userId_createdAt_idx" ON "CoinTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCatalog_code_key" ON "GiftCatalog"("code");

-- CreateIndex
CREATE INDEX "GiftEvent_fromUserId_toUserId_createdAt_idx" ON "GiftEvent"("fromUserId", "toUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTransaction" ADD CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "GiftCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
