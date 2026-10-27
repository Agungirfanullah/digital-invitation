import Link from "next/link";

import { Button } from "@/components/ui/button";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { PhoneFrame } from "@/components/invitation/phone-frame";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";

/**
 * Homepage Hero (docs/PRD.md §7, D-073). `ctaHref` is resolved once by
 * `app/page.tsx` (`/register` for an anonymous visitor, `/dashboard` for
 * an authenticated one — mirrors `app/(auth)/register/page.tsx`'s own
 * existing precedent) and passed down so this stays a plain, static
 * Server Component.
 *
 * The phone preview renders a real invitation through the same
 * `InvitationRenderer`/`buildDemoInvitation()` fabricated-demo-data path
 * as the Invitation Preview/Template Showcase sections further down —
 * not a screenshot, not a second rendering architecture. "Modern
 * Editorial" is picked here only for its bold hero typography; any other
 * template already appears later in Template Showcase.
 */
export function Hero({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-28 lg:pb-36">
      {/* Multi-layered gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 30%, color-mix(in oklab, var(--accent) 15%, transparent), transparent), radial-gradient(ellipse 60% 50% at 20% 60%, color-mix(in oklab, var(--primary) 8%, transparent), transparent)",
        }}
      />

      {/* Decorative floating orbs */}
      <div
        className="bg-primary/8 animate-float-gentle pointer-events-none absolute top-20 left-[15%] -z-10 size-72 rounded-full blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="bg-accent/10 animate-float-delayed pointer-events-none absolute right-[10%] bottom-10 -z-10 size-96 rounded-full blur-[120px]"
        aria-hidden="true"
      />

      {/* Dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="text-center lg:col-span-7 lg:text-left">
          {/* Announcement Pill */}
          <div className="animate-fade-in-up border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xs backdrop-blur-sm">
            <span className="bg-primary flex size-2 animate-pulse rounded-full" />
            Platform Undangan Digital Modern No. 1 di Indonesia
          </div>

          <h1
            className="animate-fade-in-up mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]"
            style={{ animationDelay: "100ms" }}
          >
            Undangan Digital yang{" "}
            <span className="from-primary via-primary/80 text-gradient bg-gradient-to-r to-emerald-600">
              Cantik
            </span>
            , Personal, dan Berkesan.
          </h1>

          <p
            className="animate-fade-in-up text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg lg:mx-0"
            style={{ animationDelay: "200ms" }}
          >
            Wujudkan momen istimewa tanpa repot cetak kertas. Pilih 16+ desain eksklusif, kelola
            daftar tamu, sebar personal lewat WhatsApp, dan pantau konfirmasi kehadiran secara
            instan.
          </p>

          {/* Quick value props checklist */}
          <ul
            className="animate-fade-in-up text-foreground/80 mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-medium sm:text-sm lg:justify-start"
            style={{ animationDelay: "300ms" }}
          >
            {[
              "16+ Template Eksklusif",
              "Personalisasi Nama Tamu",
              "RSVP & QR Check-in Real-time",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full">
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div
            className="animate-fade-in-up mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            style={{ animationDelay: "400ms" }}
          >
            <Button
              asChild
              size="lg"
              className="glow-primary h-12 px-8 font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl active:translate-y-0"
            >
              <Link href={ctaHref}>
                Buat Undangan
                <svg
                  className="ml-2 size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-border/80 hover:bg-accent/60 h-12 px-6 font-medium backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <a href="#template-showcase">Lihat Template</a>
            </Button>
          </div>

          {/* Product facts strip. No rating or customer-count claim: there is
              no real source for one yet (CLAUDE.md §1.4, D-073, D-092). */}
          <div
            className="animate-fade-in-up border-border/40 mt-11 flex items-center justify-center gap-8 border-t pt-7 lg:justify-start"
            style={{ animationDelay: "500ms" }}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                ✓
              </span>
              <span className="text-muted-foreground text-xs">
                <span className="text-foreground font-bold">100%</span> Siap Pakai
              </span>
            </div>
            <div className="bg-border/60 hidden h-8 w-px sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                ⚡
              </span>
              <span className="text-muted-foreground text-xs">
                <span className="text-foreground font-bold">Tanpa</span> Coding
              </span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div
          className="animate-scale-in relative mx-auto w-full max-w-[300px] lg:col-span-5 lg:max-w-[340px]"
          style={{ animationDelay: "300ms" }}
        >
          {/* Multi-layer radiant backdrop */}
          <div
            className="from-primary/25 via-accent/15 to-primary/10 animate-float-gentle absolute -inset-8 -z-10 rounded-full bg-gradient-to-tr opacity-80 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="to-primary/10 absolute -inset-4 -z-10 rounded-full bg-gradient-to-bl from-emerald-500/10 via-transparent opacity-60 blur-2xl"
            aria-hidden="true"
          />

          {/* Floating badge 1: Top Right — RSVP notification */}
          <div
            className="animate-float border-border/40 bg-card/95 absolute -top-3 -right-10 z-20 hidden items-center gap-2.5 rounded-2xl border px-4 py-2.5 shadow-xl backdrop-blur-lg sm:flex"
            aria-hidden="true"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600 shadow-inner">
              ✓
            </span>
            <div className="text-left text-xs">
              <p className="text-foreground font-bold">RSVP Hadir</p>
              <p className="text-muted-foreground text-[10px]">Sarah +1 Tamu</p>
            </div>
          </div>

          {/* Floating badge 2: Bottom Left — Templates count */}
          <div
            className="animate-float-delayed border-border/40 bg-card/95 absolute -bottom-4 -left-10 z-20 hidden items-center gap-2.5 rounded-2xl border px-4 py-2.5 shadow-xl backdrop-blur-lg sm:flex"
            aria-hidden="true"
          >
            <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-full text-xs font-bold shadow-inner">
              ★
            </span>
            <div className="text-left text-xs">
              <p className="text-foreground font-bold">16+ Template Mewah</p>
              <p className="text-muted-foreground text-[10px]">Desain responsif mobile</p>
            </div>
          </div>

          {/* Floating badge 3: Mid Right — Live indicator */}
          <div
            className="border-border/40 bg-card/95 absolute top-1/2 -right-14 z-20 hidden items-center gap-2 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-lg lg:flex"
            style={{ animation: "float 5s ease-in-out 1s infinite" }}
            aria-hidden="true"
          >
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-foreground text-[10px] font-semibold">Live Preview</span>
          </div>

          <div className="ring-border/40 from-card/80 to-card/40 rounded-[3rem] bg-gradient-to-b p-1.5 shadow-2xl ring-1 backdrop-blur-xs">
            <PhoneFrame heightClassName="h-[560px]">
              <InvitationRenderer
                invitation={buildDemoInvitation("modern-editorial")}
                bypassOpening
              />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
