import Link from "next/link";

export default function InvitationNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-foreground text-xl font-semibold tracking-tight">
        Undangan tidak ditemukan
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Tautan undangan ini tidak valid, sudah tidak berlaku, atau belum dipublikasikan.
      </p>
      <Link href="/" className="text-foreground mt-2 text-sm underline underline-offset-4">
        Kembali ke beranda
      </Link>
    </div>
  );
}
