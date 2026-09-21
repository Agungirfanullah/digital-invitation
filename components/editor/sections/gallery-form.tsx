"use client";

import { useRef, useState, useTransition } from "react";

import {
  addGalleryItemAction,
  deleteGalleryItemAction,
  moveGalleryItemAction,
  updateGalleryItemAction,
  updateGalleryItemCaptionAction,
  uploadGalleryImageAction,
} from "@/lib/editor/actions";
import { GALLERY_UPLOAD_MAX_BYTES } from "@/lib/storage/limits";
import type { EditorGallery, EditorGalleryItem } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

const MAX_UPLOAD_MB = Math.round(GALLERY_UPLOAD_MAX_BYTES / (1024 * 1024));
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

interface GalleryFormProps {
  eventId: string;
  value: EditorGallery | null;
  onChange: (value: EditorGallery) => void;
}

export function GalleryForm({ eventId, value, onChange }: GalleryFormProps) {
  const items = value?.items ?? [];

  function replaceItems(nextItems: EditorGalleryItem[]) {
    onChange({ id: value?.id ?? "", title: value?.title ?? null, items: nextItems });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Galeri</h2>
        <p className="text-muted-foreground text-sm">
          Unggah foto (JPEG, PNG, WebP, atau GIF — maksimal {MAX_UPLOAD_MB}MB) atau tambahkan tautan
          video untuk ditampilkan di undangan.
        </p>
      </div>

      {items.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Belum ada foto atau video.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <GalleryItemCard
            key={item.id}
            eventId={eventId}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onMoved={replaceItems}
            onCaptionSaved={(updated) =>
              replaceItems(
                items.map((existing) => (existing.id === updated.id ? updated : existing)),
              )
            }
            onVideoSaved={(updated) =>
              replaceItems(
                items.map((existing) => (existing.id === updated.id ? updated : existing)),
              )
            }
            onDeleted={() => replaceItems(items.filter((existing) => existing.id !== item.id))}
          />
        ))}
      </ul>

      <GalleryImageUploadForm
        eventId={eventId}
        onUploaded={(item) => replaceItems([...items, item])}
      />
      <GalleryVideoForm eventId={eventId} onAdded={(item) => replaceItems([...items, item])} />
    </div>
  );
}

function GalleryImageUploadForm({
  eventId,
  onUploaded,
}: {
  eventId: string;
  onUploaded: (item: EditorGalleryItem) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFieldErrors({ file: ["Pilih berkas gambar untuk diunggah."] });
      return;
    }

    setError(undefined);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("file", file);
    formData.set("caption", caption.trim());

    startTransition(async () => {
      const result = await uploadGalleryImageAction(eventId, formData);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error);
        return;
      }
      onUploaded(result.data);
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

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
          accept={ACCEPTED_IMAGE_TYPES}
          className="border-input file:bg-secondary block w-full rounded-md border text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
          aria-invalid={!!fieldErrors.file?.[0]}
          aria-describedby={fieldErrors.file?.[0] ? "galleryFile-error" : "galleryFile-hint"}
        />
        {fieldErrors.file?.[0] ? (
          <p id="galleryFile-error" className="text-destructive text-xs">
            {fieldErrors.file[0]}
          </p>
        ) : (
          <p id="galleryFile-hint" className="text-muted-foreground text-xs">
            JPEG, PNG, WebP, atau GIF. Maksimal {MAX_UPLOAD_MB}MB.
          </p>
        )}
      </div>

      <FormField
        label="Keterangan (opsional)"
        name="uploadCaption"
        type="text"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
      />

      <Button type="button" onClick={submit} disabled={pending}>
        {pending ? "Mengunggah..." : "Unggah Foto"}
      </Button>
    </div>
  );
}

function GalleryVideoForm({
  eventId,
  onAdded,
}: {
  eventId: string;
  onAdded: (item: EditorGalleryItem) => void;
}) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    setFieldErrors({});

    startTransition(async () => {
      const result = await addGalleryItemAction(eventId, {
        type: "VIDEO",
        url,
        caption: caption.trim() === "" ? null : caption,
      });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error);
        return;
      }
      onAdded(result.data);
      setUrl("");
      setCaption("");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">Tambah Video (tautan)</h3>
      <p className="text-muted-foreground text-xs">
        Video ditambahkan melalui tautan langsung ke berkas video, bukan diunggah — undangan ini
        belum mendukung penyimpanan berkas video.
      </p>
      <FormError message={error} />
      <FormField
        label="URL video"
        name="videoUrl"
        type="text"
        placeholder="https://..."
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        error={fieldErrors.url?.[0]}
      />
      <FormField
        label="Keterangan (opsional)"
        name="videoCaption"
        type="text"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        error={fieldErrors.caption?.[0]}
      />
      <Button type="button" variant="outline" onClick={submit} disabled={pending}>
        {pending ? "Menyimpan..." : "Tambah Video"}
      </Button>
    </div>
  );
}

function GalleryItemCard({
  eventId,
  item,
  isFirst,
  isLast,
  onMoved,
  onCaptionSaved,
  onVideoSaved,
  onDeleted,
}: {
  eventId: string;
  item: EditorGalleryItem;
  isFirst: boolean;
  isLast: boolean;
  onMoved: (items: EditorGalleryItem[]) => void;
  onCaptionSaved: (item: EditorGalleryItem) => void;
  onVideoSaved: (item: EditorGalleryItem) => void;
  onDeleted: () => void;
}) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [editingVideoUrl, setEditingVideoUrl] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [movePending, startMoveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  function move(direction: "up" | "down") {
    setError(undefined);
    startMoveTransition(async () => {
      const result = await moveGalleryItemAction(eventId, item.id, direction);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onMoved(result.data);
    });
  }

  function handleDelete() {
    setError(undefined);
    startDeleteTransition(async () => {
      const result = await deleteGalleryItemAction(eventId, item.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  }

  return (
    <li className="space-y-2 rounded-lg border p-3">
      {item.type === "VIDEO" ? (
        <video
          src={item.url}
          poster={item.thumbnailUrl ?? undefined}
          controls
          preload="metadata"
          className="aspect-square w-full rounded-md bg-black object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- our own uploaded object (or a legacy externally-hosted URL); see components/invitation/sections/gallery-section.tsx.
        <img
          src={item.thumbnailUrl ?? item.url}
          alt={item.caption ?? "Pratinjau galeri"}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-md object-cover"
        />
      )}

      <FormError message={error} />

      {editingCaption || editingVideoUrl ? (
        <GalleryItemEditForm
          eventId={eventId}
          item={item}
          mode={editingVideoUrl ? "video" : "caption"}
          onSaved={(updated) => {
            if (editingVideoUrl) onVideoSaved(updated);
            else onCaptionSaved(updated);
            setEditingCaption(false);
            setEditingVideoUrl(false);
          }}
          onCancel={() => {
            setEditingCaption(false);
            setEditingVideoUrl(false);
          }}
        />
      ) : (
        <>
          {item.caption && <p className="truncate text-xs">{item.caption}</p>}

          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingCaption(true)}
            >
              Edit Keterangan
            </Button>
            {item.type === "VIDEO" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingVideoUrl(true)}
              >
                Edit URL
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFirst || movePending}
              onClick={() => move("up")}
              aria-label="Pindahkan ke atas"
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLast || movePending}
              onClick={() => move("down")}
              aria-label="Pindahkan ke bawah"
            >
              ↓
            </Button>

            {!confirmingDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
              >
                Hapus
              </Button>
            ) : (
              <span className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deletePending}
                  onClick={handleDelete}
                >
                  {deletePending ? "Menghapus..." : "Ya, hapus"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletePending}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Batal
                </Button>
              </span>
            )}
          </div>
        </>
      )}
    </li>
  );
}

function GalleryItemEditForm({
  eventId,
  item,
  mode,
  onSaved,
  onCancel,
}: {
  eventId: string;
  item: EditorGalleryItem;
  mode: "caption" | "video";
  onSaved: (item: EditorGalleryItem) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(item.url);
  const [caption, setCaption] = useState(item.caption ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === "video"
          ? await updateGalleryItemAction(eventId, item.id, {
              type: "VIDEO",
              url,
              caption: caption.trim() === "" ? null : caption,
            })
          : await updateGalleryItemCaptionAction(eventId, item.id, {
              caption: caption.trim() === "" ? null : caption,
            });

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error);
        return;
      }
      onSaved(result.data);
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed p-2">
      <FormError message={error} />
      {mode === "video" && (
        <FormField
          label="URL video"
          name={`videoUrl-${item.id}`}
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          error={fieldErrors.url?.[0]}
        />
      )}
      <FormField
        label="Keterangan"
        name={`caption-${item.id}`}
        type="text"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        error={fieldErrors.caption?.[0]}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={submit} disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
      </div>
    </div>
  );
}
