import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

/** Makes relative metadata URLs (OG images, canonicals) absolute; skipped, not fatal, if the env var is unset or malformed. */
function resolveMetadataBase(): URL | undefined {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Digital Invitation — Undangan Digital Cantik, Elegan & Modern",
    template: "%s | Digital Invitation",
  },
  description:
    "Platform pembuatan undangan digital pernikahan, khitanan, ulang tahun & acara formal paling lengkap di Indonesia. Dilengkapi RSVP real-time, QR check-in, dan digital gift.",
  keywords: [
    "undangan digital",
    "undangan pernikahan online",
    "wedding invitation indonesia",
    "undangan digital modern",
    "rsvp online",
    "undangan qr code",
    "website pernikahan",
    "undangan wa",
    "digital gift pernikahan",
  ],
  authors: [{ name: "Digital Invitation Team" }],
  creator: "Digital Invitation",
  publisher: "Digital Invitation",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // No title/description here: a page without its own `openGraph` would
  // inherit them, so /login or a 404 would preview as the homepage. The
  // homepage sets its own (app/page.tsx); other pages fall back to <title>.
  openGraph: {
    siteName: "Digital Invitation",
    locale: "id_ID",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// The site's JSON-LD lives on the homepage (app/page.tsx), not here: a root
// layout would put it on every route, customers' invitations included (D-092).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full antialiased ${plusJakartaSans.variable}`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
