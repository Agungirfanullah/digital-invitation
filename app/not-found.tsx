import Link from "next/link";

// Next's default `_not-found` fallback is statically prerendered, which
// means it never receives a per-request nonce (proxy.ts) — under the new
// nonce-based CSP, Next's own hydration script on that static page would
// be silently blocked, hydration would fail, and the browser console
// would show a CSP violation. A custom, dynamically-rendered not-found
// page avoids that for the one route in the app that isn't already
// dynamic for an unrelated reason (auth/token/searchParams usage).
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-foreground text-xl font-semibold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/" className="text-foreground mt-2 text-sm underline underline-offset-4">
        Kembali ke beranda
      </Link>
    </div>
  );
}
