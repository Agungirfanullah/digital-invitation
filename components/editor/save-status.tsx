import type { SaveStatus } from "@/components/editor/use-autosave";
import { cn } from "@/lib/utils";

const LABELS: Record<SaveStatus, string> = {
  idle: "Tersimpan",
  saving: "Menyimpan...",
  saved: "Perubahan tersimpan",
  error: "Gagal menyimpan",
};

const TONES: Record<SaveStatus, string> = {
  idle: "border-border/60 bg-card text-muted-foreground",
  saving: "border-amber-500/25 bg-amber-500/10 text-amber-800",
  saved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

function StatusIcon({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span
        aria-hidden="true"
        className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
      />
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5"
    >
      {status === "error" ? (
        <path d="M12 8v5M12 16.5v.01M12 3.5 2.5 20h19L12 3.5Z" />
      ) : (
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      )}
    </svg>
  );
}

export function SaveStatusIndicator({ status, error }: { status: SaveStatus; error?: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex max-w-xs items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-300",
        TONES[status],
      )}
    >
      <StatusIcon status={status} />
      <span className="truncate">{status === "error" && error ? error : LABELS[status]}</span>
    </p>
  );
}
