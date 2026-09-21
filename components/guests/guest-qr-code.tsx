"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

import { buildGuestQrFileName } from "@/lib/guests/qr-filename";
import { Button } from "@/components/ui/button";

/**
 * `link` must already be the server-authorized, fully-built personalized
 * invitation URL (`buildGuestInvitationUrl()`'s output, threaded down
 * from the Server Component page) — this component never fetches,
 * derives, or accepts a raw token. It only encodes whatever URL string
 * it's given, so the existing OWNER/EDITOR-only, VIEWER-masked
 * authorization already applied to that string by the page (see
 * `getGuestInvitationDetail()`'s token masking) is what actually gates
 * whether this component ever renders at all — there is no separate
 * authorization check here because there is no separate data access here.
 */
export function GuestQrCode({ link, guestName }: { link: string; guestName: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  function handleDownload() {
    const svg = svgRef.current;
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = buildGuestQrFileName(guestName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">QR Undangan</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Kode QR ini membuka undangan pribadi tamu ini. Jika tautan dibuat ulang, QR yang sudah
          diunduh sebelumnya tidak akan berfungsi lagi.
        </p>
      </div>

      <div className="flex justify-center rounded-md bg-white p-4">
        <QRCodeSVG
          ref={svgRef}
          value={link}
          size={176}
          level="M"
          marginSize={2}
          title={`QR undangan untuk ${guestName}`}
        />
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
        Unduh QR
      </Button>
    </div>
  );
}
