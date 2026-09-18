import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getClientEnv, getServerEnv } from "@/lib/env";

const REQUIRED_SERVER_KEYS = ["DATABASE_URL", "DIRECT_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const REQUIRED_CLIENT_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const validEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  DIRECT_URL: "postgresql://user:pass@localhost:5432/db",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env = { ...process.env, ...validEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("env validation", () => {
  it("parses successfully when all required variables are present", () => {
    expect(getServerEnv().DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(getClientEnv().NEXT_PUBLIC_SUPABASE_URL).toBe(validEnv.NEXT_PUBLIC_SUPABASE_URL);
  });

  for (const key of REQUIRED_SERVER_KEYS) {
    it(`throws when server variable ${key} is missing`, () => {
      delete process.env[key];
      expect(() => getServerEnv()).toThrow();
    });
  }

  for (const key of REQUIRED_CLIENT_KEYS) {
    it(`throws when client variable ${key} is missing`, () => {
      delete process.env[key];
      expect(() => getClientEnv()).toThrow();
    });
  }
});
