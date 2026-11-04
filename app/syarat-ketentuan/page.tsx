import type { Metadata } from "next";

import { TERMS_OF_SERVICE } from "@/lib/legal/content";
import { LegalPage } from "@/components/legal/legal-page";

// Rendered per request so Next can stamp the CSP nonce on its scripts;
// a statically prerendered page would have them blocked (see app/page.tsx).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat pemakaian layanan undangan digital Digital Invitation.",
  alternates: { canonical: "/syarat-ketentuan" },
};

export default function TermsPage() {
  return (
    <LegalPage
      document={TERMS_OF_SERVICE}
      otherPage={{ href: "/kebijakan-privasi", label: "Kebijakan Privasi" }}
    />
  );
}
