import "server-only";

interface AuthErrorLike {
  code?: string | null;
  message: string;
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

/** Maps a Supabase Auth error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapSupabaseAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_MESSAGE;

  if (error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code];
  }

  console.error("[auth] Supabase auth error", { code: error.code, message: error.message });
  return GENERIC_MESSAGE;
}
