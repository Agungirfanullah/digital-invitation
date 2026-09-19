"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Client-only — copies the composed message text to the clipboard, and
 * links to `wa.me` (opens the operator's own WhatsApp with the message
 * pre-filled). Neither action is a Server Action: copying/previewing a
 * message is a client-side convenience, never recorded as a delivery
 * (see docs/DECISIONS.md).
 */
export function MessagePreview({
  messageText,
  whatsappUrl,
}: {
  messageText: string;
  whatsappUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Pratinjau Pesan</p>
      <pre className="bg-muted overflow-x-auto rounded-md p-3 text-sm whitespace-pre-wrap">
        {messageText}
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? "Tersalin!" : "Salin Pesan"}
        </Button>
        {whatsappUrl ? (
          <Button asChild size="sm">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Buka WhatsApp
            </a>
          </Button>
        ) : (
          <p className="text-muted-foreground text-xs">
            Nomor telepon belum diisi, jadi tautan WhatsApp belum tersedia.
          </p>
        )}
      </div>
      {failed && (
        <p className="text-destructive text-xs">Gagal menyalin. Salin manual dari kotak di atas.</p>
      )}
    </div>
  );
}
