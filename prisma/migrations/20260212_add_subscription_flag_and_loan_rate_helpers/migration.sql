-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSubscriber" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "subscriberSince" TIMESTAMP(3);
