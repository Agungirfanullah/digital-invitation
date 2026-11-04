import type { Metadata } from "next";

import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader, Panel } from "@/components/dashboard/page-header";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "@/components/account/account-forms";

export const metadata: Metadata = {
  title: "Akun",
};

function Section({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Panel className={`p-5 sm:p-6 ${danger ? "border-destructive/30" : ""}`}>
      <div className="grid gap-5 md:grid-cols-[14rem_1fr] md:gap-8">
        <div>
          <h2 className={`font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
        </div>
        <div className="max-w-md">{children}</div>
      </div>
    </Panel>
  );
}

export default async function AccountPage() {
  const user = await requireAppUser();
  const eventCount = await prisma.event.count({ where: { ownerId: user.id } });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Akun" description="Kelola profil, kata sandi, dan data akunmu." />

      <Section title="Profil" description="Nama ini tampil di dashboard dan untuk anggota acaramu.">
        <ProfileForm name={user.name} email={user.email} />
      </Section>

      <Section
        title="Kata sandi"
        description="Masukkan kata sandi saat ini untuk menggantinya dengan yang baru."
      >
        <PasswordForm />
      </Section>

      <Section
        title="Hapus akun"
        description="Menghapus akun beserta semua acara, tamu, dan file yang kamu unggah."
        danger
      >
        <DeleteAccountForm email={user.email} eventCount={eventCount} />
      </Section>
    </div>
  );
}
