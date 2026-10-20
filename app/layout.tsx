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
  openGraph: {
    siteName: "Digital Invitation",
    locale: "id_ID",
    type: "website",
    title: "Digital Invitation — Undangan Digital Cantik, Elegan & Modern",
    description:
      "Buat undangan digital impianmu dalam hitungan menit. Desain mewah, responsif, dan mudah dibagikan via WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Invitation — Undangan Digital Cantik & Elegan",
    description:
      "Buat undangan digital impianmu dalam hitungan menit. Desain mewah, responsif, dan mudah dibagikan via WhatsApp.",
  },
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Digital Invitation",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "IDR",
        lowPrice: "0",
        highPrice: "99000",
      },
      description:
        "Platform SaaS pembuatan undangan digital premium untuk pernikahan, aqiqah, ulang tahun, dan berbagai acara spesial di Indonesia.",
    },
    {
      "@type": "Organization",
      name: "Digital Invitation",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://digital-invitation.com",
      logo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/favicon.ico`,
      sameAs: [],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full antialiased ${plusJakartaSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
