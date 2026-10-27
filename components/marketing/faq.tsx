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
    <section
      id="faq-heading"
      aria-labelledby="faq-heading-title"
      className="bg-muted/30 relative overflow-hidden px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
            Pertanyaan Umum
          </div>
          <h2
            id="faq-heading-title"
            className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-base">
            Temukan jawaban cepat atas pertanyaan seputar fitur, paket langganan, dan penggunaan
            undangan digital.
          </p>
        </div>

        <div className="mt-14 space-y-4">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group bg-card border-border/70 open:border-primary/40 rounded-2xl border p-6 shadow-xs transition-all duration-200 open:shadow-md"
            >
              <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold select-none marker:content-none">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="bg-muted/60 text-muted-foreground group-open:bg-primary/10 group-open:text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-muted-foreground border-border/40 mt-3.5 border-t pt-3 text-sm leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
