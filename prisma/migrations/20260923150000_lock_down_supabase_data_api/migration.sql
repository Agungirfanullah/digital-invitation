-- Supabase Data API lockdown — see docs/DECISIONS.md D-054.
--
-- Supabase exposes the `public` schema through its Data API (PostgREST /
-- pg_graphql) to the `anon` and `authenticated` roles. The `postgres`
-- role's default privileges in `public` grant ALL on every new table to
-- both roles, so every table Prisma created was fully readable and
-- writable by anyone holding the (public-by-design) anon key, bypassing
-- all application-level authorization.
--
-- This application never uses the Data API for table access: all table
-- reads/writes go through Prisma as the table-owning, BYPASSRLS `postgres`
-- role, and Supabase JS is only used server-side for Auth and Storage.
-- So the correct policy is deny-all for `anon`/`authenticated`: RLS
-- enabled with NO policies, plus revoked privileges (RLS alone does not
-- cover TRUNCATE/REFERENCES/TRIGGER). Prisma is unaffected — the table
-- owner / BYPASSRLS role is not subject to RLS.

-- 1. Enable RLS (no policies = no rows visible/writable for non-bypass roles).
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Theme" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuestInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Venue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gallery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GalleryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoveStory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoveStoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RSVP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wish" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckIn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftMethod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftRegistry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftReservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvitationView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeddingProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2. Revoke the Data API roles' privileges, now and for future objects
--    created by this (migration-running) role. Guarded so the migration
--    stays portable to a plain PostgreSQL database without Supabase roles.
DO $$
DECLARE
  data_api_role text;
BEGIN
  FOREACH data_api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = data_api_role) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', data_api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', data_api_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', data_api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', data_api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', data_api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', data_api_role);
    END IF;
  END LOOP;
END $$;
