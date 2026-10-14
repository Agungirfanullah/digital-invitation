"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { uploadGalleryImageAction } from "@/lib/editor/actions";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_FILES_PER_BATCH,
  countByStatus,
  describeBatch,
  formatFileSize,
  limitBatch,
  precheckFile,
  type UploadEntry,
} from "@/lib/editor/upload-queue";
import { GALLERY_UPLOAD_MAX_BYTES } from "@/lib/storage/limits";
import type { EditorGalleryItem } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

const MAX_UPLOAD_MB = Math.round(GALLERY_UPLOAD_MAX_BYTES / (1024 * 1024));

const STATUS_LABELS: Record<UploadEntry["status"], string> = {
  ready: "Menunggu",
  uploading: "Mengunggah...",
  done: "Berhasil",
  error: "Gagal",
};

/**
 * Uploads one or several photos. The server takes exactly one file per
 * request (its body limit is sized for a single photo), so a selection is
 * sent one photo at a time, in the order chosen: that also keeps the
 * gallery order equal to the selection order, since each new item's position
 * is computed from the count at the moment it is saved. A photo the server
 * rejects (wrong format, too large) is marked and skipped; any other
 * failure — such as the upload rate limit — stops the batch and leaves the
 * remaining photos waiting, so they can be sent again.
 */
export function GalleryImageUploadForm({
  eventId,
  onUploaded,
}: {
  eventId: string;
  onUploaded: (item: EditorGalleryItem) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(new Map<string, File>());
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [caption, setCaption] = useState("");
  const [notice, setNotice] = useState<string | undefined>();
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const counts = countByStatus(entries);
  const readyCount = counts.ready;
  const singleFile = entries.length <= 1;

  function updateEntry(id: string, patch: Partial<UploadEntry>) {
    setEntries((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    setError(undefined);
    setFieldError(undefined);
    filesRef.current.clear();

    const { kept, dropped } = limitBatch(picked, MAX_FILES_PER_BATCH);
    setNotice(
      dropped > 0
        ? `Maksimal ${MAX_FILES_PER_BATCH} foto per unggahan. ${dropped} foto terakhir tidak dimasukkan.`
        : undefined,
    );

    setEntries(
      kept.map((file) => {
        const id = crypto.randomUUID();
        const problem = precheckFile(file, GALLERY_UPLOAD_MAX_BYTES);
        if (!problem) filesRef.current.set(id, file);
        return {
          id,
          name: file.name,
          size: file.size,
          status: problem ? "error" : "ready",
          error: problem ?? undefined,
        };
      }),
    );
  }

  function clearSelection() {
    filesRef.current.clear();
    setEntries([]);
    setNotice(undefined);
    setError(undefined);
    setFieldError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    const queue = entries.filter((item) => item.status === "ready");
    if (queue.length === 0) {
      setFieldError("Pilih berkas gambar untuk diunggah.");
      return;
    }

    setError(undefined);
    setFieldError(undefined);
    setUploading(true);

    let uploadedAny = false;
    for (const item of queue) {
      const file = filesRef.current.get(item.id);
      if (!file) continue;

      updateEntry(item.id, { status: "uploading" });

      const formData = new FormData();
      formData.set("file", file);
      // One caption can only describe one photo; with several, each photo's
      // caption is edited on its own card afterwards.
      formData.set("caption", entries.length === 1 ? caption.trim() : "");

      const result = await uploadGalleryImageAction(eventId, formData);

      if (result.ok) {
        uploadedAny = true;
        filesRef.current.delete(item.id);
        updateEntry(item.id, { status: "done", error: undefined });
        onUploaded(result.data);
        continue;
      }

      const fileProblem = result.fieldErrors?.file?.[0];
      if (fileProblem) {
        filesRef.current.delete(item.id);
        updateEntry(item.id, { status: "error", error: fileProblem });
        continue;
      }

      // Not about this photo (rate limit, session, permissions): stop, and
      // keep this and the remaining photos waiting so they can be retried.
      updateEntry(item.id, { status: "ready" });
      setError(result.error);
      break;
    }

    setUploading(false);
    if (uploadedAny && entries.length === 1) setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const summary = describeBatch(entries, uploading);
  const buttonLabel = uploading
    ? summary
    : readyCount > 1
      ? `Unggah ${readyCount} Foto`
      : "Unggah Foto";

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">Unggah Foto</h3>
      <FormError message={error} />

      <div className="space-y-1.5">
        <label htmlFor="galleryFile" className="text-sm leading-none font-medium">
          Berkas gambar
        </label>
        <input
          ref={fileInputRef}
          id="galleryFile"
          name="file"
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
          disabled={uploading}
          onChange={handleSelect}
          className="border-input file:bg-secondary block w-full rounded-md border text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "galleryFile-error" : "galleryFile-hint"}
        />
        {fieldError ? (
          <p id="galleryFile-error" className="text-destructive text-xs">
            {fieldError}
          </p>
        ) : (
          <p id="galleryFile-hint" className="text-muted-foreground text-xs">
            JPEG, PNG, WebP, atau GIF. Maksimal {MAX_UPLOAD_MB}MB per foto. Bisa memilih beberapa
            foto sekaligus (hingga {MAX_FILES_PER_BATCH}).
          </p>
        )}
      </div>

      {notice && <p className="text-muted-foreground text-xs">{notice}</p>}

      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium" role="status" aria-live="polite">
            {summary || `${entries.length} berkas dipilih.`}
          </p>
          <ul className="divide-y rounded-md border text-sm">
            {entries.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate">{item.name}</p>
                  <p className="text-muted-foreground text-xs">{formatFileSize(item.size)}</p>
                  {item.error && <p className="text-destructive text-xs">{item.error}</p>}
                </div>
                <span
                  className={
                    item.status === "error"
                      ? "text-destructive shrink-0 text-xs font-medium"
                      : item.status === "done"
                        ? "text-primary shrink-0 text-xs font-medium"
                        : "text-muted-foreground shrink-0 text-xs"
                  }
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {singleFile ? (
        <FormField
          label="Keterangan (opsional)"
          name="uploadCaption"
          type="text"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
      ) : (
        <p className="text-muted-foreground text-xs">
          Keterangan tiap foto bisa ditambahkan setelah diunggah, lewat tombol Edit Keterangan.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={submit} disabled={uploading}>
          {buttonLabel}
        </Button>
        {entries.length > 0 && !uploading && (
          <Button type="button" variant="outline" onClick={clearSelection}>
            Bersihkan Daftar
          </Button>
        )}
      </div>
    </div>
  );
}
