import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Digital Invitation",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2 text-sm">Selamat datang kembali.</p>

      <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">Belum ada acara.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Fitur pembuatan acara akan hadir pada tahap pengembangan berikutnya.
        </p>
      </div>
    </div>
  );
}
