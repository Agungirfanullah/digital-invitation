"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Client-only — copies the personalized invitation link to the clipboard.
 * No Server Action needed; this never mutates anything, just reads a
 * value already present on the page.
 */
export function CopyInviteLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? "Tersalin!" : "Salin Tautan"}
      </Button>
      {failed && <p className="text-destructive text-xs">Gagal menyalin. Salin manual: {link}</p>}
    </div>
  );
}
