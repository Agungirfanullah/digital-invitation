import type { Metadata } from "next";

import { PRIVACY_POLICY } from "@/lib/legal/content";
import { LegalPage } from "@/components/legal/legal-page";

// Rendered per request so Next can stamp the CSP nonce on its scripts;
// a statically prerendered page would have them blocked (see app/page.tsx).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Data apa yang dikumpulkan Digital Invitation, untuk apa dipakai, dan hak pengguna atas datanya.",
  alternates: { canonical: "/kebijakan-privasi" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      document={PRIVACY_POLICY}
      otherPage={{ href: "/syarat-ketentuan", label: "Syarat & Ketentuan" }}
    />
  );
}
