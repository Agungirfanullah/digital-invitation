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
        className="pointer-events-none absolute top-20 left-[15%] -z-10 size-72 rounded-full bg-primary/8 blur-[100px] animate-float-gentle"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 right-[10%] -z-10 size-96 rounded-full bg-accent/10 blur-[120px] animate-float-delayed"
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
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary shadow-xs backdrop-blur-sm">
            <span className="flex size-2 rounded-full bg-primary animate-pulse" />
            Platform Undangan Digital Modern No. 1 di Indonesia
          </div>

          <h1 className="animate-fade-in-up mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1] text-balance" style={{ animationDelay: "100ms" }}>
            Undangan Digital yang{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-emerald-600 text-gradient">
              Cantik
            </span>
            , Personal, dan Berkesan.
          </h1>

          <p className="animate-fade-in-up text-muted-foreground mt-6 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0" style={{ animationDelay: "200ms" }}>
            Wujudkan momen istimewa tanpa repot cetak kertas. Pilih 16+ desain eksklusif, kelola daftar tamu, sebar personal lewat WhatsApp, dan pantau konfirmasi kehadiran secara instan.
          </p>

          {/* Quick value props checklist */}
          <ul className="animate-fade-in-up mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-foreground/80 lg:justify-start" style={{ animationDelay: "300ms" }}>
            {["16+ Template Eksklusif", "Personalisasi Nama Tamu", "RSVP & QR Check-in Real-time"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="animate-fade-in-up mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start" style={{ animationDelay: "400ms" }}>
            <Button asChild size="lg" className="h-12 px-8 font-semibold shadow-lg glow-primary hover:opacity-95 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <Link href={ctaHref}>
                Buat Undangan
                <svg className="ml-2 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 font-medium border-border/80 hover:bg-accent/60 transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm">
              <a href="#template-showcase">Lihat Template</a>
            </Button>
          </div>

          {/* Social proof strip */}
          <div className="animate-fade-in-up mt-11 flex items-center justify-center gap-8 border-t border-border/40 pt-7 lg:justify-start" style={{ animationDelay: "500ms" }}>
            <div className="flex items-center gap-2.5">
              <div className="flex text-amber-500 text-sm tracking-widest font-bold">★★★★★</div>
              <div>
                <span className="text-sm font-bold text-foreground">4.9/5</span>
                <span className="text-xs text-muted-foreground ml-1">Rating</span>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border/60" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">✓</span>
              <span className="text-xs text-muted-foreground"><span className="font-bold text-foreground">100%</span> Siap Pakai</span>
            </div>
            <div className="hidden md:block h-8 w-px bg-border/60" />
            <div className="hidden md:flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">⚡</span>
              <span className="text-xs text-muted-foreground"><span className="font-bold text-foreground">Tanpa</span> Coding</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="relative mx-auto w-full max-w-[300px] lg:col-span-5 lg:max-w-[340px] animate-scale-in" style={{ animationDelay: "300ms" }}>
          {/* Multi-layer radiant backdrop */}
          <div
            className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-tr from-primary/25 via-accent/15 to-primary/10 blur-3xl opacity-80 animate-float-gentle"
            aria-hidden="true"
          />
          <div
            className="absolute -inset-4 -z-10 rounded-full bg-gradient-to-bl from-emerald-500/10 via-transparent to-primary/10 blur-2xl opacity-60"
            aria-hidden="true"
          />

          {/* Floating badge 1: Top Right — RSVP notification */}
          <div
            className="animate-float absolute -top-3 -right-10 z-20 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border/40 bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-lg"
            aria-hidden="true"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-bold shadow-inner">
              ✓
            </span>
            <div className="text-left text-xs">
              <p className="font-bold text-foreground">RSVP Hadir</p>
              <p className="text-[10px] text-muted-foreground">Sarah +1 Tamu</p>
            </div>
          </div>

          {/* Floating badge 2: Bottom Left — Templates count */}
          <div
            className="animate-float-delayed absolute -bottom-4 -left-10 z-20 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border/40 bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-lg"
            aria-hidden="true"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold shadow-inner">
              ★
            </span>
            <div className="text-left text-xs">
              <p className="font-bold text-foreground">16+ Template Mewah</p>
              <p className="text-[10px] text-muted-foreground">Desain responsif mobile</p>
            </div>
          </div>

          {/* Floating badge 3: Mid Right — Live indicator */}
          <div
            className="absolute top-1/2 -right-14 z-20 hidden lg:flex items-center gap-2 rounded-xl border border-border/40 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-lg"
            style={{ animation: "float 5s ease-in-out 1s infinite" }}
            aria-hidden="true"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-foreground">Live Preview</span>
          </div>

          <div className="rounded-[3rem] p-1.5 ring-1 ring-border/40 shadow-2xl bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xs">
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
