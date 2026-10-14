"use client";

import { useRef, useState, useTransition } from "react";

import { removeIdentityPhotoAction, uploadIdentityPhotoAction } from "@/lib/editor/actions";
import { ACCEPTED_IMAGE_MIME_TYPES, precheckFile } from "@/lib/editor/upload-queue";
import { GALLERY_UPLOAD_MAX_BYTES } from "@/lib/storage/limits";
import { Button } from "@/components/ui/button";

const MAX_UPLOAD_MB = Math.round(GALLERY_UPLOAD_MAX_BYTES / (1024 * 1024));

interface IdentityPhotoFieldProps {
  eventId: string;
  label: string;
  name: string;
  /** The stored photo URL, or `null` when there is none. */
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
}

/**
 * One identity photo (a person, or an organization's logo). Choosing a file
 * uploads it right away and hands the new URL to the form, whose autosave
 * stores it with the rest of the profile. Replacing or removing a photo also
 * removes the old file from storage, so unused uploads do not pile up.
 */
export function IdentityPhotoField({
  eventId,
  label,
  name,
  value,
  onChange,
  error,
}: IdentityPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSelect() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    const precheck = precheckFile(file, GALLERY_UPLOAD_MAX_BYTES);
    if (precheck) {
      setProblem(precheck);
      resetInput();
      return;
    }

    setProblem(undefined);
    setBusy("upload");
    const formData = new FormData();
    formData.set("file", file);
    if (value) formData.set("previousUrl", value);

    startTransition(async () => {
      const result = await uploadIdentityPhotoAction(eventId, formData);
      setBusy(null);
      resetInput();
      if (!result.ok) {
        setProblem(result.fieldErrors?.file?.[0] ?? result.error);
        return;
      }
      onChange(result.data.publicUrl);
    });
  }

  function handleRemove() {
    if (!value) return;
    setProblem(undefined);
    setBusy("remove");

    startTransition(async () => {
      const result = await removeIdentityPhotoAction(eventId, value);
      setBusy(null);
      if (!result.ok) {
        setProblem(result.error);
        return;
      }
      onChange(null);
    });
  }

  const shownProblem = problem ?? error;
  const inputId = `${name}-file`;

  return (
    <div className="space-y-2">
      <p className="text-sm leading-none font-medium">{label}</p>

      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- our own uploaded storage object.
          <img
            src={value}
            alt={`Foto: ${label}`}
            className="size-20 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div
            className="text-muted-foreground bg-secondary/40 flex size-20 shrink-0 items-center justify-center rounded-md border border-dashed text-center text-xs"
            aria-hidden
          >
            Belum ada foto
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className={`border-input bg-background hover:bg-secondary inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-sm font-medium shadow-sm ${
              pending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {busy === "upload" ? "Mengunggah..." : value ? "Ganti Foto" : "Pilih Foto"}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="file"
            accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
            disabled={pending}
            onChange={handleSelect}
            className="sr-only"
            aria-invalid={!!shownProblem}
            aria-describedby={`${name}-hint`}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={handleRemove}
            >
              {busy === "remove" ? "Menghapus..." : "Hapus Foto"}
            </Button>
          )}
        </div>
      </div>

      {shownProblem ? (
        <p id={`${name}-hint`} role="alert" className="text-destructive text-xs">
          {shownProblem}
        </p>
      ) : (
        <p id={`${name}-hint`} className="text-muted-foreground text-xs">
          JPEG, PNG, WebP, atau GIF. Maksimal {MAX_UPLOAD_MB}MB.
        </p>
      )}
    </div>
  );
}
