-- Shared rate limiter counters — see docs/DECISIONS.md D-089.
-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- Supabase Data API lockdown for the new table (D-054, DATABASE.md §40):
-- RLS enabled with no policies, plus explicit revokes for the Data API roles.
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  data_api_role text;
BEGIN
  FOREACH data_api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = data_api_role) THEN
      EXECUTE format('REVOKE ALL ON "RateLimitBucket" FROM %I', data_api_role);
    END IF;
  END LOOP;
END
$$;
