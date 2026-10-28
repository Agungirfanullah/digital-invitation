import { EVENT_TYPE_LABELS } from "@/lib/events/labels";

export interface FaqItem {
  question: string;
  answer: string;
}

const EVENT_TYPE_LIST = Object.values(EVENT_TYPE_LABELS)
  .filter((label) => label !== "Lainnya")
  .join(", ");

/**
 * Homepage FAQ (docs/PRD.md §8 item 12, D-073). Rendered by
 * `components/marketing/faq.tsx` and emitted as FAQPage JSON-LD from the
 * same list, so the two never drift. Every answer is grounded in
 * implemented behavior — no invented refund, SLA, uptime, or
 * data-retention policy (none exist in the current product contract).
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Apakah ada paket gratis?",
    answer:
      "Ada. Kamu bisa mulai membuat undangan tanpa biaya. Selama masa awal, semua fitur bisa dipakai gratis; paket berbayar segera hadir.",
  },
  {
    question: "Acara apa saja yang bisa dibuatkan undangan?",
    answer: `${EVENT_TYPE_LIST}, serta acara lainnya. Setiap jenis acara punya isian dan susunan bagian yang sesuai.`,
  },
  {
    question: "Apakah undangan langsung terlihat publik setelah dibuat?",
    answer:
      "Tidak. Acara yang baru dibuat berstatus draf dan hanya kamu yang bisa melihatnya sampai kamu memutuskan untuk mempublikasikannya.",
  },
  {
    question: "Bagaimana cara membagikan undangan ke tamu?",
    answer:
      "Setiap tamu mendapat tautan undangan pribadi dengan namanya sendiri. Dari dashboard, kamu bisa mengirim tautan itu langsung lewat WhatsApp.",
  },
  {
    question: "Bagaimana tamu mengisi kehadiran (RSVP)?",
    answer: "Tamu mengisi RSVP langsung dari tautan undangan pribadi yang kamu bagikan ke mereka.",
  },
  {
    question: "Apakah undangan saya muncul di Google?",
    answer:
      "Tidak. Undangan, termasuk foto di dalamnya, tidak diindeks mesin pencari dan hanya bisa dibuka oleh orang yang menerima tautannya.",
  },
  {
    question: "Bisakah tamu check-in dengan QR di lokasi acara?",
    answer:
      "Bisa. Tamu dengan tautan pribadi punya kode QR di undangannya, dan panitia memindainya dari menu Check-in di dashboard. Satu tamu tidak bisa check-in dua kali.",
  },
  {
    question: "Apakah template bisa diganti setelah undangan dibuat?",
    answer:
      "Bisa. Template dipilih dan diganti kapan saja dari editor undangan, dan isi undanganmu tetap tersimpan.",
  },
  {
    question: "Apakah undangan bisa dibuka dengan nyaman lewat HP?",
    answer: "Bisa. Setiap template dirancang mobile-first agar nyaman dibuka dari ponsel tamu.",
  },
];
