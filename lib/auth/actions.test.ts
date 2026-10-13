import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();
const ensureAppUser = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signUp } }),
}));
vi.mock("@/lib/auth/provisioning", () => ({
  ensureAppUser: (...args: unknown[]) => ensureAppUser(...args),
}));
vi.mock("@/lib/auth/rate-limit", () => ({ checkAuthRateLimit: async () => true }));
vi.mock("@/lib/auth/urls", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/urls")>()),
  getAuthCallbackUrl: (next: string) => `https://app.test/auth/callback?next=${next}`,
}));

import { registerAction } from "@/lib/auth/actions";
import { EMAIL_ALREADY_REGISTERED_MESSAGE } from "@/lib/auth/errors";

function registerForm() {
  const form = new FormData();
  form.set("name", "Budi");
  form.set("email", "Budi@Example.com");
  form.set("password", "Password123");
  form.set("confirmPassword", "Password123");
  return form;
}

beforeEach(() => {
  signUp.mockReset();
  ensureAppUser.mockReset();
  redirect.mockClear();
});

describe("registerAction — email that is already registered", () => {
  it("tells the user so when Supabase hides it behind an empty identities list", async () => {
    signUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [] }, session: null },
      error: null,
    });

    const result = await registerAction({}, registerForm());

    expect(result.error).toBe(EMAIL_ALREADY_REGISTERED_MESSAGE);
    expect(result.success).toBeUndefined();
    expect(ensureAppUser).not.toHaveBeenCalled();
  });

  it("still reports it when Supabase does return the explicit error (confirmation off)", async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "user_already_exists", message: "User already registered" },
    });

    const result = await registerAction({}, registerForm());

    expect(result.error).toBe(EMAIL_ALREADY_REGISTERED_MESSAGE);
  });
});

describe("registerAction — keeps what was typed when it fails", () => {
  it("returns the trimmed name and email, never a password, when validation fails", async () => {
    const form = registerForm();
    form.set("name", "  Budi Santoso ");
    form.set("confirmPassword", "Berbeda12345");

    const result = await registerAction({}, form);

    expect(result.error).toBeTruthy();
    expect(result.values).toEqual({ name: "Budi Santoso", email: "Budi@Example.com" });
    expect(JSON.stringify(result)).not.toContain("Password123");
    expect(JSON.stringify(result)).not.toContain("Berbeda12345");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("also returns them for an already-registered email and for a Supabase error", async () => {
    signUp.mockResolvedValueOnce({
      data: { user: { id: "u1", identities: [] }, session: null },
      error: null,
    });
    const existing = await registerAction({}, registerForm());
    expect(existing.values).toEqual({ name: "Budi", email: "Budi@Example.com" });

    signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { code: "weak_password", message: "weak" },
    });
    const weak = await registerAction({}, registerForm());
    expect(weak.values).toEqual({ name: "Budi", email: "Budi@Example.com" });
  });

  it("does not attach values to a successful sign-up", async () => {
    signUp.mockResolvedValue({
      data: { user: { id: "u2", identities: [{ id: "i1" }] }, session: null },
      error: null,
    });

    const result = await registerAction({}, registerForm());

    expect(result.success).toBe(true);
    expect(result.values).toBeUndefined();
  });
});

describe("registerAction — normal outcomes are unchanged", () => {
  it("a new address (non-empty identities, no session) shows the check-your-email success", async () => {
    signUp.mockResolvedValue({
      data: { user: { id: "u2", identities: [{ id: "i1" }] }, session: null },
      error: null,
    });

    const result = await registerAction({}, registerForm());

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("an existing but unconfirmed account (Supabase re-sends the email) also shows the success", async () => {
    signUp.mockResolvedValue({
      data: { user: { id: "u3", identities: [{ id: "i1" }] }, session: null },
      error: null,
    });

    const result = await registerAction({}, registerForm());

    expect(result.success).toBe(true);
  });

  it("immediate-session sign-up provisions the app user and redirects to onboarding", async () => {
    signUp.mockResolvedValue({
      data: { user: { id: "u4", identities: [{ id: "i1" }] }, session: { access_token: "t" } },
      error: null,
    });

    await expect(registerAction({}, registerForm())).rejects.toThrow("NEXT_REDIRECT:/onboarding");
    expect(ensureAppUser).toHaveBeenCalledWith({
      id: "u4",
      email: "budi@example.com",
      name: "Budi",
    });
  });
});
