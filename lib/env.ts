import { z } from "zod";

/**
 * Server-only environment variables. Import this module only from
 * server-side code (Server Components, Server Actions, Route Handlers).
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("invitation-media"),
  SUPABASE_AUTH_REDIRECT_URL: z.string().url().optional(),
  APP_SECRET: z.string().min(16, "APP_SECRET must be at least 16 characters").optional(),
});

/**
 * Public (client-safe) environment variables. These are inlined into the
 * browser bundle by Next.js, so only ever put non-secret values here.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

/** Validates and returns server-only environment variables. Throws if invalid/missing. */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment configuration: ${formatIssues(parsed.error)}`);
  }
  return parsed.data;
}

/** Validates and returns public environment variables. Throws if invalid/missing. */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(`Invalid client environment configuration: ${formatIssues(parsed.error)}`);
  }
  return parsed.data;
}
