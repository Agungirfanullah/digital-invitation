"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

import { Button } from "@/components/ui/button";

export interface QrCodeScannerProps {
  /** Fires once per decoded code while the scanner is active — never fires again until `active` cycles false→true, even if the same code stays in frame. */
  onDecode: (value: string) => void;
  /** Parent controls this: true while nothing else (preview/result) is being shown, false to pause the camera without tearing it down. */
  active: boolean;
}

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

/**
 * Wraps the `qr-scanner` library (see docs/DECISIONS.md's Phase 14
 * entry for why it was selected). Camera access is only ever requested
 * when the staff member explicitly taps "Mulai Pindai" — never
 * automatically on mount, per this phase's explicit UX requirement.
 */
export function QrCodeScanner({ onDecode, active }: QrCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const hasDecodedRef = useRef(false);
  const [permission, setPermission] = useState<PermissionState>("idle");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (active) {
      hasDecodedRef.current = false;
      if (permission === "granted") void scannerRef.current?.start();
    } else {
      scannerRef.current?.stop();
    }
  }, [active, permission]);

  async function handleStart() {
    if (!videoRef.current || starting) return;
    setStarting(true);
    setPermission("requesting");

    const hasCamera = await QrScanner.hasCamera().catch(() => false);
    if (!hasCamera) {
      setPermission("unavailable");
      setStarting(false);
      return;
    }

    if (!scannerRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          if (hasDecodedRef.current) return;
          hasDecodedRef.current = true;
          onDecode(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          preferredCamera: "environment",
        },
      );
    }

    try {
      await scannerRef.current.start();
      setPermission("granted");
    } catch {
      // getUserMedia rejects for both "permission denied" and "no camera
      // device" in a browser-dependent way — QrScanner.hasCamera() above
      // already ruled out the latter, so a rejection here is treated as
      // a denial/unavailability, not a generic crash.
      setPermission("denied");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ display: permission === "granted" ? "block" : "none" }}
          muted
          playsInline
        />
        {permission !== "granted" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {permission === "denied" && (
              <p className="text-destructive text-sm">
                Izin kamera ditolak atau tidak tersedia. Gunakan pencarian manual di bawah, atau
                izinkan akses kamera di pengaturan browser lalu coba lagi.
              </p>
            )}
            {permission === "unavailable" && (
              <p className="text-destructive text-sm">
                Tidak ada kamera yang terdeteksi pada perangkat ini. Gunakan pencarian manual di
                bawah.
              </p>
            )}
            {(permission === "idle" || permission === "requesting") && (
              <p className="text-muted-foreground text-sm">
                Aktifkan kamera untuk memindai kode QR undangan tamu. Browser akan meminta izin
                akses kamera.
              </p>
            )}
            <Button type="button" onClick={handleStart} disabled={starting}>
              {starting ? "Membuka kamera..." : "Mulai Pindai"}
            </Button>
          </div>
        )}
      </div>
      {permission === "granted" && (
        <p className="text-muted-foreground text-center text-xs">
          Arahkan kamera ke kode QR undangan tamu.
        </p>
      )}
    </div>
  );
}
