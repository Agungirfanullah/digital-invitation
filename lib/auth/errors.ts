import "server-only";

interface AuthErrorLike {
  code?: string | null;
  message: string;
  name?: string;
  status?: number;
}

const GENERIC_MESSAGE = "Terjadi kesalahan saat memproses permintaan. Coba lagi.";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Email atau kata sandi salah.",
  email_not_confirmed: "Email belum diverifikasi. Silakan cek kotak masuk kamu.",
  user_already_exists: "Email ini sudah terdaftar. Coba masuk atau atur ulang kata sandi.",
  email_exists: "Email ini sudah terdaftar. Coba masuk atau atur ulang kata sandi.",
  weak_password: "Kata sandi terlalu lemah. Gunakan minimal 8 karakter dengan huruf dan angka.",
  over_email_send_rate_limit: "Terlalu banyak permintaan email. Coba lagi beberapa saat lagi.",
  over_request_rate_limit: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
  same_password: "Kata sandi baru harus berbeda dari kata sandi lama.",
  session_not_found: "Sesi tidak valid atau sudah kedaluwarsa. Silakan masuk kembali.",
};

export const EMAIL_ALREADY_REGISTERED_MESSAGE = MESSAGES.email_exists;

/**
 * With email confirmation on, Supabase does not return an error for an
 * address that already has a confirmed account: it answers "success" with an
 * obfuscated user whose `identities` list is empty, and sends no email. The
 * sign-up screen reports that case explicitly (docs/DECISIONS.md D-084). An
 * existing but still unconfirmed account is not matched here — Supabase
 * re-sends its confirmation email and returns a normal, non-empty user.
 */
export function isObfuscatedExistingUser(
  user: { identities?: readonly unknown[] | null } | null | undefined,
): boolean {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

/** Maps a Supabase Auth error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapSupabaseAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_MESSAGE;

  if (error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code];
  }

  // Some Supabase responses (notably the email send limit) arrive as a bare
  // 429 / "rate limit exceeded" with no `code`, so match on those too.
  if (!error.code && (error.status === 429 || /rate limit/i.test(error.message))) {
    return MESSAGES.over_email_send_rate_limit;
  }

  // Serialized to one string: structured objects get flattened to `{}` by some
  // log pipelines (Next dev, Vercel), which hides the only clue to the cause.
  console.error(
    `[auth] Supabase auth error ${JSON.stringify({
      code: error.code ?? null,
      status: error.status ?? null,
      name: error.name ?? null,
      message: error.message,
    })}`,
  );
  return GENERIC_MESSAGE;
}
