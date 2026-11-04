import Link from "next/link";

import { TEMPLATE_KEYS } from "@/lib/invitations/templates/registry";
import { BRAND, legalContactEmail, type LegalDocument } from "@/lib/legal/content";
import { templateDisplayName } from "@/lib/marketing/demo-invitation";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

/** Shared layout for the legal pages: marketing header, a readable column, footer. */
export function LegalPage({
  document,
  otherPage,
}: {
  document: LegalDocument;
  otherPage: { href: string; label: string };
}) {
  const email = legalContactEmail();
  const templates = TEMPLATE_KEYS.map((slug) => ({ slug, name: templateDisplayName(slug) }));

  return (
    <>
      <SiteHeader ctaHref="/register" />
      <main className="px-5 py-14 sm:px-6 sm:py-20">
        <article className="mx-auto max-w-2xl">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">{BRAND}</p>
          <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {document.title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Berlaku sejak {document.effectiveDate}
          </p>
          <p className="text-foreground/90 mt-6 leading-relaxed">{document.intro}</p>

          <div className="mt-10 space-y-9">
            {document.sections.map((section, index) => (
              <section key={section.heading} aria-labelledby={`legal-${index}`}>
                <h2
                  id={`legal-${index}`}
                  className="text-foreground text-lg font-semibold tracking-tight"
                >
                  {index + 1}. {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-foreground/85 mt-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="text-foreground/85 mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section aria-labelledby="legal-contact">
              <h2
                id="legal-contact"
                className="text-foreground text-lg font-semibold tracking-tight"
              >
                {document.sections.length + 1}. Hubungi kami
              </h2>
              <p className="text-foreground/85 mt-3 leading-relaxed">
                {email ? (
                  <>
                    Untuk pertanyaan, permintaan terkait data pribadi, atau laporan penyalahgunaan,
                    kirim email ke{" "}
                    <a
                      href={`mailto:${email}`}
                      className="text-primary font-medium underline underline-offset-4"
                    >
                      {email}
                    </a>
                    .
                  </>
                ) : (
                  <>
                    Untuk pertanyaan atau permintaan terkait data pribadi, masuk ke akunmu: data
                    akun dan acara dapat diubah dari dashboard, dan akun beserta datanya dapat
                    dihapus melalui menu Akun.
                  </>
                )}
              </p>
            </section>
          </div>

          <p className="text-muted-foreground border-border/60 mt-12 border-t pt-6 text-sm">
            Baca juga{" "}
            <Link
              href={otherPage.href}
              className="text-primary font-medium underline underline-offset-4"
            >
              {otherPage.label}
            </Link>
            .
          </p>
        </article>
      </main>
      <SiteFooter templates={templates} />
    </>
  );
}
