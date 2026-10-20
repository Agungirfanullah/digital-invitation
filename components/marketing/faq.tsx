/**
 * Homepage FAQ (docs/PRD.md §8 item 12, D-073). Every answer is grounded
 * in documented/implemented behavior — no invented refund, SLA, uptime,
 * or data-retention policy (none exist in the current product contract).
 */
const FAQ_ITEMS = [
  {
    question: "Apakah ada paket gratis?",
    answer:
      "Ada. Paket Free memungkinkanmu membuat undangan tanpa biaya, dengan batas jumlah acara dan tamu.",
  },
  {
    question: "Apakah undangan langsung terlihat publik setelah dibuat?",
    answer:
      "Tidak. Acara yang baru dibuat berstatus draf dan hanya kamu yang bisa melihatnya sampai kamu memutuskan untuk mempublikasikannya.",
  },
  {
    question: "Bagaimana tamu mengisi kehadiran (RSVP)?",
    answer: "Tamu mengisi RSVP langsung dari tautan undangan pribadi yang kamu bagikan ke mereka.",
  },
  {
    question: "Apakah undangan bisa dibuka dengan nyaman lewat HP?",
    answer: "Bisa. Setiap template dirancang mobile-first agar nyaman dibuka dari ponsel tamu.",
  },
];

export function Faq() {
  return (
    <section id="faq-heading" aria-labelledby="faq-heading-title" className="bg-muted/30 px-6 py-20 sm:py-28 relative overflow-hidden">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            Pertanyaan Umum
          </div>
          <h2
            id="faq-heading-title"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-balance"
          >
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-muted-foreground mt-3 text-base max-w-xl mx-auto">
            Temukan jawaban cepat atas pertanyaan seputar fitur, paket langganan, dan penggunaan undangan digital.
          </p>
        </div>

        <div className="mt-14 space-y-4">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group bg-card rounded-2xl border border-border/70 p-6 shadow-xs transition-all duration-200 open:border-primary/40 open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground text-base marker:content-none select-none">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="flex size-7 items-center justify-center rounded-full bg-muted/60 text-muted-foreground shrink-0 text-sm font-bold transition-transform duration-200 group-open:rotate-45 group-open:bg-primary/10 group-open:text-primary"
                >
                  +
                </span>
              </summary>
              <p className="text-muted-foreground mt-3.5 text-sm leading-relaxed border-t border-border/40 pt-3">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
