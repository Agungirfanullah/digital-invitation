import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Digital Invitation SaaS
      </p>
      <h1 className="text-foreground max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Fondasi proyek sedang dibangun.
      </h1>
      <p className="text-muted-foreground max-w-md text-base">
        Halaman produk, editor undangan, dan fitur tamu akan hadir pada fase pengembangan
        berikutnya.
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild>
          <Link href="/register">Buat Akun</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Masuk</Link>
        </Button>
      </div>
    </main>
  );
}
