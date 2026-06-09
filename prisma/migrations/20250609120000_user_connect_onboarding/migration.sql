-- AlterTable
ALTER TABLE "User" ADD COLUMN "orgName" TEXT,
ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeConnectAccountId" TEXT,
ADD COLUMN "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

-- Existing users with campaigns skip onboarding
UPDATE "User"
SET "onboardingComplete" = true
WHERE id IN (SELECT DISTINCT "userId" FROM "Campaign");
