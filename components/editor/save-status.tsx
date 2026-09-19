import type { SaveStatus } from "@/components/editor/use-autosave";
import { cn } from "@/lib/utils";

const LABELS: Record<SaveStatus, string> = {
  idle: "Tersimpan",
  saving: "Menyimpan...",
  saved: "Perubahan tersimpan",
  error: "Gagal menyimpan",
};

export function SaveStatusIndicator({ status, error }: { status: SaveStatus; error?: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("text-xs", status === "error" ? "text-destructive" : "text-muted-foreground")}
    >
      {status === "error" && error ? error : LABELS[status]}
    </p>
  );
}
