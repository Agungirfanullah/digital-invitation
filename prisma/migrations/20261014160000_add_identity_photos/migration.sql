-- Identity photos: the bride and groom each get a photo, every other identity
-- family one photo (the celebrant, the baby, the host, the organization's
-- logo). Nullable, so existing profiles are unchanged. See docs/DECISIONS.md D-091.
-- AlterTable
ALTER TABLE "WeddingProfile" ADD COLUMN "bridePhotoUrl" TEXT,
ADD COLUMN "groomPhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "PersonProfile" ADD COLUMN "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "BabyFamilyProfile" ADD COLUMN "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "HostProfile" ADD COLUMN "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "OrganizationProfile" ADD COLUMN "photoUrl" TEXT;
