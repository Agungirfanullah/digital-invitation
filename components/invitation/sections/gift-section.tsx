import type { PublicGiftMethod } from "@/lib/invitations/types";
import { GIFT_METHOD_TYPE_LABELS } from "@/lib/gifts/labels";
import { CopyValueButton } from "@/components/gifts/copy-value-button";
import { SectionHeading } from "@/components/invitation/sections/section-heading";

/**
 * Only rendered when the event owner has configured at least one active
 * gift method — an unused section is hidden entirely rather than shown
 * with placeholder content (docs/DECISIONS.md D-034, CLAUDE.md §9E).
 */
export function GiftSection({ giftMethods }: { giftMethods: PublicGiftMethod[] }) {
  if (giftMethods.length === 0) return null;

  return (
    <section aria-labelledby="gift-heading" className="px-8 py-20">
      <div className="mx-auto max-w-md text-[color:var(--ii-text)]">
        <SectionHeading id="gift-heading">Kirim Hadiah</SectionHeading>
        <div className="divide-y divide-[color:var(--ii-secondary)] border-y border-[color:var(--ii-secondary)]">
          {giftMethods.map((method) => (
            <div key={method.id} className="py-7 text-sm">
              <p className="text-xs tracking-wide text-[color:var(--ii-accent)] uppercase">
                {GIFT_METHOD_TYPE_LABELS[method.type]}
              </p>
              <p
                className="mt-1 text-2xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
              </p>

              {method.accountName && (
                <p className="mt-2 opacity-90">Atas nama: {method.accountName}</p>
              )}

              {method.accountNumber && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono">{method.accountNumber}</span>
                  <CopyValueButton value={method.accountNumber} label="Salin Nomor" />
                </div>
              )}

              {method.qrImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL; see love-story-section.tsx.
                <img
                  src={method.qrImageUrl}
                  alt={`Kode QR ${method.providerName ?? "hadiah"}`}
                  loading="lazy"
                  className="mt-3 h-48 w-48 object-contain"
                />
              )}

              {method.instructions && (
                <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap opacity-80">{method.instructions}</p>
                  {/* Only the manual/physical-gift type treats `instructions` as a
                    copyable address — for BANK/EWALLET/QR it's just a note next
                    to the account number/QR that's already independently copyable. */}
                  {method.type === "OTHER" && (
                    <CopyValueButton value={method.instructions} label="Salin Alamat" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
