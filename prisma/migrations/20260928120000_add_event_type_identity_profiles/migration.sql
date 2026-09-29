-- Event-type identity profiles — see docs/DATABASE.md §42 and
-- docs/DECISIONS.md D-060.
--
-- Purely additive: existing WeddingProfile rows are untouched (one new
-- nullable column), and four new 1:1-with-Event tables are created for the
-- PERSON, BABY_FAMILY, HOST_GROUP and ORGANIZATION identity families.
-- WeddingProfile remains the storage for the whole COUPLE family.

-- AlterTable
ALTER TABLE "WeddingProfile" ADD COLUMN     "yearsTogether" INTEGER;

-- CreateTable
CREATE TABLE "PersonProfile" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fullName" TEXT,
    "nickname" TEXT,
    "age" INTEGER,
    "milestone" TEXT,
    "hostedBy" TEXT,
    "instagram" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BabyFamilyProfile" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "babyFullName" TEXT,
    "babyNickname" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "birthDate" DATE,
    "birthDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BabyFamilyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostProfile" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "hostName" TEXT,
    "occasionTheme" TEXT,
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationName" TEXT,
    "contactPerson" TEXT,
    "dressCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonProfile_eventId_key" ON "PersonProfile"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "BabyFamilyProfile_eventId_key" ON "BabyFamilyProfile"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "HostProfile_eventId_key" ON "HostProfile"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProfile_eventId_key" ON "OrganizationProfile"("eventId");

-- AddForeignKey
ALTER TABLE "PersonProfile" ADD CONSTRAINT "PersonProfile_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BabyFamilyProfile" ADD CONSTRAINT "BabyFamilyProfile_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostProfile" ADD CONSTRAINT "HostProfile_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase Data API lockdown for the new tables (D-054, DATABASE.md §40):
-- RLS enabled with no policies, plus explicit revokes. The default
-- privileges revoked in 20260923150000 already cover new tables created by
-- this role; the explicit REVOKE keeps this migration correct on its own.
ALTER TABLE "PersonProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BabyFamilyProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HostProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationProfile" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  data_api_role text;
BEGIN
  FOREACH data_api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = data_api_role) THEN
      EXECUTE format('REVOKE ALL ON "PersonProfile", "BabyFamilyProfile", "HostProfile", "OrganizationProfile" FROM %I', data_api_role);
    END IF;
  END LOOP;
END $$;
