"use client";

import { useState, useTransition } from "react";

import {
  addGalleryItemAction,
  deleteGalleryItemAction,
  updateGalleryItemAction,
} from "@/lib/editor/actions";
import type { EditorGallery, EditorGalleryItem } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

interface GalleryFormProps {
  eventId: string;
  value: EditorGallery | null;
  onChange: (value: EditorGallery) => void;
}

export function GalleryForm({ eventId, value, onChange }: GalleryFormProps) {
  const items = value?.items ?? [];
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [pendingDeleteId, startDeleteTransition] = useTransition();

  function withUpdatedItems(items: EditorGalleryItem[]) {
    onChange({ id: value?.id ?? "", title: value?.title ?? null, items });
  }

  function handleCreated(item: EditorGalleryItem) {
    withUpdatedItems([...items, item]);
    setEditingId(null);
  }

  function handleUpdated(item: EditorGalleryItem) {
    withUpdatedItems(items.map((existing) => (existing.id === item.id ? item : existing)));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setDeleteError(undefined);
    startDeleteTransition(async () => {
      const result = await deleteGalleryItemAction(eventId, id);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      withUpdatedItems(items.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Galeri</h2>
        <p className="text-muted-foreground text-sm">
          Tautan foto atau video untuk ditampilkan di undangan. Unggah berkas belum didukung —
          tempel tautan gambar/video yang sudah tersedia secara publik.
        </p>
      </div>

      <FormError message={deleteError} />

      {items.length === 0 && editingId !== "new" && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Belum ada foto atau video.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) =>
          editingId === item.id ? null : (
            <li key={item.id} className="space-y-2 rounded-lg border p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URLs; matches components/invitation/sections. */}
              <img
                src={item.thumbnailUrl ?? item.url}
                alt={item.caption ?? "Pratinjau galeri"}
                loading="lazy"
                className="aspect-square w-full rounded-md object-cover"
              />
              {item.caption && <p className="truncate text-xs">{item.caption}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(item.id)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendingDeleteId}
                  onClick={() => handleDelete(item.id)}
                >
                  Hapus
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {items.some((item) => editingId === item.id) && (
        <GalleryItemForm
          eventId={eventId}
          initial={items.find((item) => item.id === editingId) ?? null}
          onSaved={handleUpdated}
          onCancel={() => setEditingId(null)}
        />
      )}

      {editingId === "new" ? (
        <GalleryItemForm
          eventId={eventId}
          initial={null}
          onSaved={handleCreated}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setEditingId("new")}>
          Tambah Foto/Video
        </Button>
      )}
    </div>
  );
}

function GalleryItemForm({
  eventId,
  initial,
  onSaved,
  onCancel,
}: {
  eventId: string;
  initial: EditorGalleryItem | null;
  onSaved: (item: EditorGalleryItem) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<"IMAGE" | "VIDEO">(initial?.type ?? "IMAGE");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    const input = { type, url, caption: caption.trim() === "" ? null : caption };

    startTransition(async () => {
      const result = initial
        ? await updateGalleryItemAction(eventId, initial.id, input)
        : await addGalleryItemAction(eventId, input);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error);
        return;
      }
      onSaved(result.data);
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormError message={error} />

      <div className="space-y-1.5">
        <label htmlFor="galleryItemType" className="text-sm leading-none font-medium">
          Jenis
        </label>
        <Select
          id="galleryItemType"
          value={type}
          onChange={(e) => setType(e.target.value as "IMAGE" | "VIDEO")}
        >
          <option value="IMAGE">Foto</option>
          <option value="VIDEO">Video</option>
        </Select>
      </div>

      <FormField
        label="URL"
        name="url"
        type="text"
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={fieldErrors.url?.[0]}
      />
      <FormField
        label="Keterangan (opsional)"
        name="caption"
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        error={fieldErrors.caption?.[0]}
      />

      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
      </div>
    </div>
  );
}
