-- CreateIndex
CREATE INDEX "GuestInvitation_eventId_idx" ON "GuestInvitation"("eventId");

-- AddForeignKey
ALTER TABLE "GuestInvitation" ADD CONSTRAINT "GuestInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
