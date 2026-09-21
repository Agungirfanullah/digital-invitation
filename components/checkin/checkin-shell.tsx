"use client";

import { useCallback, useRef, useState, useTransition } from "react";

import {
  confirmManualCheckInAction,
  confirmQrCheckInAction,
  previewManualCheckInAction,
  previewQrCheckInAction,
} from "@/lib/checkin/actions";
import type { CheckInGuestView, CheckInOutcome } from "@/lib/checkin/types";
import { CHECKIN_OUTCOME_MESSAGES } from "@/lib/checkin/labels";
import { QrCodeScanner } from "@/components/checkin/qr-code-scanner";
import { ManualSearch } from "@/components/checkin/manual-search";
import { GuestConfirmationCard } from "@/components/checkin/guest-confirmation-card";
import { Button } from "@/components/ui/button";

type Mode = "scan" | "search";

/** What the reception screen is currently showing, in state-machine form — never more than one of these is true at once. */
type Stage =
  | { kind: "idle" }
  | { kind: "loading"; source: "qr" | "manual"; value: string }
  | { kind: "preview"; source: "qr" | "manual"; value: string; guest: CheckInGuestView }
  | { kind: "error"; message: string }
  | { kind: "result"; outcome: CheckInOutcome };

export interface CheckInShellProps {
  eventId: string;
  /** VIEWER never sees confirm affordances — server-side authorization is the real guard (see lib/checkin/service.ts), this only avoids showing a dead-end action. */
  canMutate: boolean;
}

/**
 * Reception-mode orchestrator: after any result (success, duplicate,
 * invalid, error), the operator stays on this page and one obvious action
 * — "Pindai / Cari Tamu Lain" — resets straight back to scanning, per this
 * phase's explicit "fast repeated-scan workflow" requirement. No routing
 * away from /check-in ever happens as part of the happy path.
 */
export function CheckInShell({ eventId, canMutate }: CheckInShellProps) {
  const [mode, setMode] = useState<Mode>("scan");
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  const reset = useCallback(() => {
    submittingRef.current = false;
    setStage({ kind: "idle" });
  }, []);

  const runPreview = useCallback(
    (source: "qr" | "manual", value: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setStage({ kind: "loading", source, value });

      startTransition(async () => {
        const formData = new FormData();
        formData.set(source === "qr" ? "scannedValue" : "guestId", value);
        const result =
          source === "qr"
            ? await previewQrCheckInAction(eventId, formData)
            : await previewManualCheckInAction(eventId, formData);

        submittingRef.current = false;
        if (!result.ok) {
          setStage({ kind: "error", message: result.error });
          return;
        }
        setStage({ kind: "preview", source, value, guest: result.guest });
      });
    },
    [eventId],
  );

  const confirm = useCallback(() => {
    if (stage.kind !== "preview" || submittingRef.current) return;
    const { source, value } = stage;
    submittingRef.current = true;

    startTransition(async () => {
      const formData = new FormData();
      formData.set(source === "qr" ? "scannedValue" : "guestId", value);
      const outcome =
        source === "qr"
          ? await confirmQrCheckInAction(eventId, formData)
          : await confirmManualCheckInAction(eventId, formData);

      submittingRef.current = false;
      setStage({ kind: "result", outcome });
    });
  }, [eventId, stage]);

  const scannerActive = mode === "scan" && stage.kind === "idle";

  return (
    <div className="space-y-6">
      {stage.kind === "idle" && (
        <>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "scan" ? "default" : "outline"}
              onClick={() => setMode("scan")}
            >
              Pindai QR
            </Button>
            <Button
              type="button"
              variant={mode === "search" ? "default" : "outline"}
              onClick={() => setMode("search")}
            >
              Cari Manual
            </Button>
          </div>

          {mode === "scan" ? (
            <QrCodeScanner active={scannerActive} onDecode={(value) => runPreview("qr", value)} />
          ) : (
            <ManualSearch eventId={eventId} onSelect={(guestId) => runPreview("manual", guestId)} />
          )}
        </>
      )}

      {stage.kind === "loading" && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Memuat data tamu...
        </p>
      )}

      {stage.kind === "error" && (
        <div className="space-y-3 rounded-lg border border-dashed p-6 text-center">
          <p className="text-destructive text-sm font-medium">{stage.message}</p>
          <Button type="button" onClick={reset}>
            Pindai / Cari Tamu Lain
          </Button>
        </div>
      )}

      {stage.kind === "preview" && (
        <GuestConfirmationCard
          guest={stage.guest}
          onConfirm={canMutate ? confirm : undefined}
          confirmPending={pending}
          showConfirm={canMutate && !stage.guest.isCheckedIn}
          confirmLabel={stage.guest.isCheckedIn ? undefined : "Konfirmasi Check-in"}
          onReset={reset}
          resetLabel="Batal"
        />
      )}

      {stage.kind === "result" && (
        <div className="space-y-4">
          <ResultBanner outcome={stage.outcome} />
          {"guest" in stage.outcome && (
            <GuestConfirmationCard
              guest={stage.outcome.guest}
              onReset={reset}
              showConfirm={false}
              resetLabel="Pindai / Cari Tamu Lain"
            />
          )}
          {!("guest" in stage.outcome) && (
            <div className="text-center">
              <Button type="button" onClick={reset}>
                Pindai / Cari Tamu Lain
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultBanner({ outcome }: { outcome: CheckInOutcome }) {
  const styles: Record<CheckInOutcome["outcome"], string> = {
    SUCCESS: "border-green-200 bg-green-50 text-green-800",
    ALREADY_CHECKED_IN: "border-amber-200 bg-amber-50 text-amber-800",
    INVALID_GUEST: "border-destructive/30 bg-destructive/10 text-destructive",
    UNAUTHORIZED: "border-destructive/30 bg-destructive/10 text-destructive",
    RATE_LIMITED: "border-destructive/30 bg-destructive/10 text-destructive",
    VALIDATION_ERROR: "border-destructive/30 bg-destructive/10 text-destructive",
    UNEXPECTED_ERROR: "border-destructive/30 bg-destructive/10 text-destructive",
  };

  const message =
    outcome.outcome === "SUCCESS"
      ? CHECKIN_OUTCOME_MESSAGES.SUCCESS
      : outcome.outcome === "ALREADY_CHECKED_IN"
        ? CHECKIN_OUTCOME_MESSAGES.ALREADY_CHECKED_IN
        : outcome.message;

  return (
    <p
      className={`rounded-lg border p-4 text-center text-sm font-medium ${styles[outcome.outcome]}`}
    >
      {message}
    </p>
  );
}
