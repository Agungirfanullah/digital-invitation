import type { ReactNode } from "react";
import Link from "next/link";

import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { SECTION_LINKS } from "@/components/marketing/nav-links";
import { BrandLogo } from "@/components/marketing/brand-logo";

const EVENT_TYPES = Object.values(EVENT_TYPE_LABELS).filter((label) => label !== "Lainnya");

/**
 * Homepage Footer (docs/PRD.md §8 item 14, D-073). Only links to routes
 * that actually exist — no fabricated About/Careers/Privacy/Terms pages
 * (none exist in this repository). Each template links to its public demo,
 * which also gives search engines a crawlable path to every demo page.
 */
export function SiteFooter({ templates }: { templates: { slug: string; name: string }[] }) {
  return (
    <footer className="border-border/60 bg-card border-t px-5 pt-16 pb-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandLogo />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
              Undangan digital untuk pernikahan dan momen spesial lainnya, lengkap dengan RSVP,
              ucapan, dan check-in QR.
            </p>
          </div>

          <FooterColumn title="Produk" className="lg:col-span-2">
            {SECTION_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn
            title="Demo template"
            className="lg:col-span-4"
            listClassName="grid grid-cols-2 gap-x-6 gap-y-2.5"
          >
            {templates.map((template) => (
              <li key={template.slug}>
                <Link
                  href={`/demo/${template.slug}`}
                  className="hover:text-foreground transition-colors"
                >
                  {template.name}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Akun" className="lg:col-span-2">
            <li>
              <Link href="/register" className="hover:text-foreground transition-colors">
                Buat Akun
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Masuk
              </Link>
            </li>
          </FooterColumn>
        </div>

        <p className="text-muted-foreground border-border/60 mt-12 border-t pt-6 text-xs leading-relaxed">
          Undangan digital untuk {EVENT_TYPES.join(", ")}, dan acara lainnya.
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          © {new Date().getFullYear()} Digital Invitation · Platform Undangan Digital Indonesia
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className,
  listClassName = "space-y-2.5",
  children,
}: {
  title: string;
  className?: string;
  listClassName?: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      <ul className={`text-muted-foreground mt-4 text-sm ${listClassName}`}>{children}</ul>
    </nav>
  );
}
