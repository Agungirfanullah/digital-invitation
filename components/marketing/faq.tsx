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
        <dl className="mt-10 space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="bg-background rounded-lg border p-5">
              <dt className="font-medium">{item.question}</dt>
              <dd className="text-muted-foreground mt-1 text-sm">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
