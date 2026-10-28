import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { PhoneFrame } from "@/components/invitation/phone-frame";
import { ArrowRightIcon, CheckIcon, QrCodeIcon, SendIcon } from "@/components/marketing/icons";
import { PhoneAutoScroll } from "@/components/marketing/phone-auto-scroll";
import { buildDemoInvitationWithPhotos } from "@/lib/marketing/demo-invitation";

const HERO_TEMPLATE = "dark-luxury";

/** Plain product facts, not ratings or customer counts (CLAUDE.md §1.4, D-073, D-092). */
const FACTS = ["Gratis untuk mulai", "Tamu tidak perlu instal aplikasi", "Kirim lewat WhatsApp"];

/**
 * Homepage Hero (docs/PRD.md §7, D-073). `ctaHref` is resolved once by
 * `app/page.tsx` (`/register` for an anonymous visitor, `/dashboard` for
 * an authenticated one) and passed down so this stays a Server Component.
 *
 * The phone renders a real invitation through `InvitationRenderer` with the
 * shared demo data and sample photos (`buildDemoInvitationWithPhotos()`),
 * slowly scrolling so the visitor sees more than the cover. The floating
 * cards around it are illustrations of real features with sample content,
 * decorative and hidden from assistive technology.
 */
export function Hero({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="relative isolate overflow-hidden px-5 pt-14 pb-20 sm:px-6 sm:pt-20 lg:pt-24 lg:pb-28">
      {/* Grid backdrop, faded out towards the edges */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 75%)",
        }}
      />
      <div
        className="bg-primary/15 animate-float-gentle pointer-events-none absolute -top-24 right-[10%] -z-10 size-[28rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[5%] -z-10 size-80 rounded-full bg-emerald-300/20 blur-[110px]"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="text-center lg:col-span-7 lg:text-left">
          <p className="animate-fade-in-up border-border/70 bg-card/80 text-foreground/80 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-xs backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="bg-primary/60 absolute inline-flex size-full animate-ping rounded-full" />
              <span className="bg-primary relative inline-flex size-2 rounded-full" />
            </span>
            Platform Undangan Digital Modern No. 1 di Indonesia
          </p>

          <h1
            className="animate-fade-in-up mt-6 text-[2.5rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-[4rem]"
            style={{ animationDelay: "80ms" }}
          >
            Undangan Digital yang{" "}
            {/* "Cantik," stays on one line so the comma never wraps alone. */}
            <span className="whitespace-nowrap">
              <span className="from-primary text-gradient decoration-primary/30 bg-gradient-to-r to-emerald-500 underline decoration-4 underline-offset-[6px] sm:decoration-[6px] sm:underline-offset-[10px]">
                Cantik
              </span>
              ,
            </span>{" "}
            Personal, dan Berkesan.
          </h1>

          <p
            className="animate-fade-in-up text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0"
            style={{ animationDelay: "160ms" }}
          >
            Pilih desain, isi detail acaramu, lalu kirim undangan dengan nama setiap tamu lewat
            WhatsApp. Kehadiran, ucapan, dan check-in tercatat rapi di satu dashboard.
          </p>

          <div
            className="animate-fade-in-up mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
            style={{ animationDelay: "240ms" }}
          >
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-full px-7 text-base font-semibold shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Link href={ctaHref}>
                Buat Undangan
                <ArrowRightIcon className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-card/70 h-12 rounded-full px-7 text-base font-medium backdrop-blur-sm transition-all hover:-translate-y-0.5"
            >
              <a href="#template-showcase">Lihat Template</a>
            </Button>
          </div>

          <ul
            className="animate-fade-in-up text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm lg:justify-start"
            style={{ animationDelay: "320ms" }}
          >
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <CheckIcon className="text-primary size-4" />
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="animate-scale-in relative mx-auto w-full max-w-[260px] sm:max-w-[290px] lg:col-span-5 lg:max-w-[320px]"
          style={{ animationDelay: "200ms" }}
        >
          <div
            className="from-primary/30 absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr via-emerald-300/20 to-transparent blur-3xl"
            aria-hidden="true"
          />

          <div className="rounded-[3.2rem] bg-white/60 p-1.5 shadow-2xl ring-1 shadow-emerald-950/20 ring-black/5 backdrop-blur-sm">
            <PhoneFrame heightClassName="h-[560px]">
              <PhoneAutoScroll />
              <InvitationRenderer
                invitation={buildDemoInvitationWithPhotos(HERO_TEMPLATE)}
                bypassOpening
              />
            </PhoneFrame>
          </div>

          <FloatingCard className="animate-float -top-2 -left-16 hidden sm:flex">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckIcon className="size-4" />
            </span>
            <span>
              <span className="text-foreground block text-xs font-bold">RSVP masuk</span>
              <span className="text-muted-foreground block text-[11px]">Hadir · 2 orang</span>
            </span>
          </FloatingCard>

          <FloatingCard className="animate-float-delayed top-1/2 -right-20 hidden max-w-[210px] sm:flex">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25d366]/15 text-[#128c4a]">
              <SendIcon className="size-4" />
            </span>
            <span>
              <span className="text-foreground block text-xs font-bold">Pesan siap dikirim</span>
              <span className="text-muted-foreground block text-[11px] leading-snug">
                “Halo Bapak Rudi, dengan penuh kebahagiaan…”
              </span>
            </span>
          </FloatingCard>

          <FloatingCard className="animate-float-gentle -bottom-5 -left-10 hidden sm:flex">
            <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
              <QrCodeIcon className="size-4" />
            </span>
            <span>
              <span className="text-foreground block text-xs font-bold">Berhasil check-in</span>
              <span className="text-muted-foreground block text-[11px]">Pindai QR di lokasi</span>
            </span>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`border-border/60 bg-card/95 absolute z-20 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 shadow-xl shadow-emerald-950/10 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
