"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Client-only, read-only convenience — copies a displayed value (account
 * number, e-wallet ID, delivery address) to the clipboard. Never reports
 * success unless `navigator.clipboard.writeText` actually resolves, and
 * never sends the copied value anywhere (no analytics, no network call).
 */
export function CopyValueButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label={`${label}: ${value}`}
      >
        {copied ? "Tersalin!" : label}
      </Button>
      {failed && <p className="text-destructive text-xs">Gagal menyalin. Salin manual di atas.</p>}
    </div>
  );
}
