import type { ReactNode } from "react";

import { BrandLogo } from "@/components/marketing/brand-logo";

/** Product facts for the side panel — features that exist, no ratings or user counts (CLAUDE.md §1.4). */
const HIGHLIGHTS = [
  "Pilih dari belasan template dan sesuaikan warna serta font",
  "Kirim tautan pribadi ke setiap tamu lewat WhatsApp",
  "Pantau RSVP, ucapan, dan check-in dari satu dashboard",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <BrandLogo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="border-border/60 bg-card w-full max-w-sm rounded-3xl border p-6 shadow-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>

      <aside className="from-primary relative isolate hidden overflow-hidden bg-gradient-to-br to-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 60% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 60% 30%, black, transparent)",
          }}
        />
        <div
          className="animate-float-gentle pointer-events-none absolute -top-24 -right-24 -z-10 size-96 rounded-full bg-emerald-300/25 blur-3xl"
          aria-hidden="true"
        />
        <p className="max-w-md text-3xl leading-tight font-extrabold tracking-tight text-balance">
          Undangan digital yang cantik, personal, dan berkesan.
        </p>
        <ul className="mt-8 max-w-md space-y-3 text-sm text-white/85">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs"
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
