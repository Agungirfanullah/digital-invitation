-- Admin can suspend an account (D-107). Null means active, so every
-- existing user stays active.
-- AlterTable
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
