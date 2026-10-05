import Link from "next/link";

export default function DemoNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-foreground text-xl font-semibold tracking-tight">
        Template tidak ditemukan
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Template yang kamu cari tidak ada atau sudah tidak tersedia.
      </p>
      <Link
        href="/#template-showcase"
        className="text-foreground mt-2 text-sm underline underline-offset-4"
      >
        Lihat semua template
      </Link>
    </div>
  );
}
