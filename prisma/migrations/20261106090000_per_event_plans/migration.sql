-- Plans are bought per event (D-112): link subscriptions and payments to
-- the event and plan, give pending orders an expiry, and add a one-time
-- billing interval. Additive only: every existing row keeps its values.

-- AlterEnum
ALTER TYPE "BillingInterval" ADD VALUE 'ONE_TIME';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "eventId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "planId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_eventId_idx" ON "Subscription"("eventId");

-- CreateIndex
CREATE INDEX "Payment_eventId_idx" ON "Payment"("eventId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

