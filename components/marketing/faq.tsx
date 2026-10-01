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
    <section aria-labelledby="faq-heading" className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h2
          id="faq-heading"
          className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Pertanyaan yang Sering Diajukan
        </h2>
        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group bg-background rounded-xl border p-5 open:pb-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                {item.question}
                <span
                  aria-hidden
                  className="text-muted-foreground shrink-0 text-lg transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-muted-foreground mt-3 text-sm">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
