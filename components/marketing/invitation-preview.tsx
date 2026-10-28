import Link from "next/link";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { PhoneFrame } from "@/components/invitation/phone-frame";
import { ArrowUpRightIcon, CheckIcon } from "@/components/marketing/icons";
import { PhoneAutoScroll } from "@/components/marketing/phone-auto-scroll";
import { buildDemoInvitationWithPhotos } from "@/lib/marketing/demo-invitation";

const PREVIEW_TEMPLATE = "floral-romance";

/** What a guest gets, all real sections of the invitation (docs/PRD.md §15). */
const GUEST_EXPERIENCE = [
  { title: "Sapaan dengan nama tamu", detail: "Setiap tautan menyapa tamunya sendiri." },
  { title: "Hitung mundur & jadwal", detail: "Tanggal, jam, dan tombol simpan ke kalender." },
  { title: "Lokasi acara", detail: "Alamat lengkap dan tautan peta." },
  { title: "Galeri foto", detail: "Foto kalian tampil rapi dan bisa diperbesar." },
  { title: "RSVP & ucapan", detail: "Tamu konfirmasi hadir dan mengirim doa." },
  { title: "Amplop digital", detail: "Rekening dan e-wallet yang mudah disalin." },
];

/**
 * Homepage Invitation Preview (docs/PRD.md §8 item 5, D-073). Renders a
 * real invitation through the real `InvitationRenderer`/template system —
 * not a second rendering architecture — using fabricated demo data with
 * sample photos, never a real `Event`. `bypassOpening` is required here
 * (D-069): the Homepage is public marketing, not the guest experience the
 * Opening/Reveal gate is for.
 */
export function InvitationPreview() {
  return (
    <section
      aria-labelledby="invitation-preview-heading"
      className="relative isolate overflow-hidden bg-[oklch(0.2_0.03_165)] px-5 py-20 text-white sm:px-6 sm:py-28"
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="text-center lg:text-left">
          <p className="text-sm font-semibold text-emerald-300">Pratinjau interaktif</p>
          <h2
            id="invitation-preview-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Lihat Tampilan Undanganmu
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
            Ini undangan sungguhan, bukan gambar. Sentuh layarnya untuk menggulir sendiri, atau
            biarkan berjalan untuk melihat semua bagiannya.
          </p>

          <ul className="mt-9 grid gap-x-6 gap-y-5 text-left sm:grid-cols-2">
            {GUEST_EXPERIENCE.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <CheckIcon className="size-3.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block text-sm text-white/60">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href={`/demo/${PREVIEW_TEMPLATE}`}
            target="_blank"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[oklch(0.2_0.03_165)] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Buka demo layar penuh
            <ArrowUpRightIcon className="size-4" />
          </Link>
        </div>

        <figure className="relative mx-auto w-full max-w-[300px]">
          <figcaption className="sr-only">
            Contoh undangan digital template Floral Romance
          </figcaption>
          <div className="rounded-[3.2rem] bg-white/10 p-1.5 shadow-2xl ring-1 ring-white/15 backdrop-blur-sm">
            <PhoneFrame heightClassName="h-[600px]">
              <PhoneAutoScroll />
              <InvitationRenderer
                invitation={buildDemoInvitationWithPhotos(PREVIEW_TEMPLATE)}
                bypassOpening
              />
            </PhoneFrame>
          </div>
        </figure>
      </div>
    </section>
  );
}
