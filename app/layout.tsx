import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Invitation",
  description: "Buat undangan digital yang cantik, personal, dan berkesan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
