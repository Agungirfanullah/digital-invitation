import { z } from "zod";

import { passwordSchema } from "@/lib/auth/validation";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama terlalu panjang."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Masukkan kata sandi saat ini."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "Kata sandi baru harus berbeda dari yang sekarang.",
    path: ["password"],
  });

/** The owner types their own email to confirm deleting the account. */
export function deleteAccountSchema(email: string) {
  return z.object({
    confirmEmail: z
      .string()
      .trim()
      .toLowerCase()
      .refine((value) => value === email.toLowerCase(), {
        message: "Email tidak cocok dengan email akunmu.",
      }),
  });
}
