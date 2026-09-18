import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function EventNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-3 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Acara tidak ditemukan</h1>
      <p className="text-muted-foreground text-sm">
        Acara ini tidak ada, atau kamu tidak memiliki akses untuk melihatnya.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
