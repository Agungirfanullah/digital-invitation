"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  addLoveStoryItemAction,
  deleteLoveStoryItemAction,
  saveLoveStoryTitleAction,
  updateLoveStoryItemAction,
} from "@/lib/editor/actions";
import type { EditorLoveStory, EditorLoveStoryItem } from "@/lib/editor/types";
import { useAutosave, type SaveStatus } from "@/components/editor/use-autosave";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

interface LoveStoryFormProps {
  eventId: string;
  value: EditorLoveStory | null;
  onChange: (value: EditorLoveStory) => void;
  onStatusChange?: (status: SaveStatus, error?: string) => void;
}

export function LoveStoryForm({ eventId, value, onChange, onStatusChange }: LoveStoryFormProps) {
  const items = value?.items ?? [];
  const [title, setTitle] = useState(value?.title ?? "");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [pendingDeleteId, startDeleteTransition] = useTransition();

  const saveTitle = useCallback(
    async (current: string) => {
      const result = await saveLoveStoryTitleAction(eventId, {
        title: current.trim() === "" ? null : current,
      });
      if (result.ok) {
        onChange(result.data);
        return { ok: true };
      }
      return { ok: false, error: result.error };
    },
    [eventId, onChange],
  );

  const { status, error } = useAutosave(title, saveTitle);

  useEffect(() => {
    onStatusChange?.(status, error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, error]);

  function withUpdatedItems(items: EditorLoveStoryItem[]) {
    onChange({ id: value?.id ?? "", title: value?.title ?? null, items });
  }

  function handleCreated(item: EditorLoveStoryItem) {
    withUpdatedItems([...items, item]);
    setEditingId(null);
  }

  function handleUpdated(item: EditorLoveStoryItem) {
    withUpdatedItems(items.map((existing) => (existing.id === item.id ? item : existing)));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setDeleteError(undefined);
    startDeleteTransition(async () => {
      const result = await deleteLoveStoryItemAction(eventId, id);
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
        <h2 className="text-lg font-semibold tracking-tight">Kisah Cinta</h2>
        <p className="text-muted-foreground text-sm">
          Perjalanan kisah kalian, dari awal bertemu hingga menikah.
        </p>
      </div>

      <FormField
        label="Judul bagian"
        name="loveStoryTitle"
        type="text"
        placeholder="Kisah Kami"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <FormError message={deleteError} />

      {items.length === 0 && editingId !== "new" && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Belum ada momen yang ditambahkan.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <LoveStoryItemForm
                eventId={eventId}
                initial={item}
                onSaved={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={item.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {item.dateLabel && (
                    <p className="text-muted-foreground text-xs uppercase">{item.dateLabel}</p>
                  )}
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                  )}
                </div>
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
              </div>
            </li>
          ),
        )}
      </ul>

      {editingId === "new" ? (
        <LoveStoryItemForm
          eventId={eventId}
          initial={null}
          onSaved={handleCreated}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setEditingId("new")}>
          Tambah Momen
        </Button>
      )}
    </div>
  );
}

function LoveStoryItemForm({
  eventId,
  initial,
  onSaved,
  onCancel,
}: {
  eventId: string;
  initial: EditorLoveStoryItem | null;
  onSaved: (item: EditorLoveStoryItem) => void;
  onCancel: () => void;
}) {
  const [dateLabel, setDateLabel] = useState(initial?.dateLabel ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    const input = {
      dateLabel: dateLabel.trim() === "" ? null : dateLabel,
      title,
      description: description.trim() === "" ? null : description,
      imageUrl: imageUrl.trim() === "" ? null : imageUrl,
    };

    startTransition(async () => {
      const result = initial
        ? await updateLoveStoryItemAction(eventId, initial.id, input)
        : await addLoveStoryItemAction(eventId, input);

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
      <FormField
        label="Label tanggal (opsional)"
        name="dateLabel"
        type="text"
        placeholder="2018"
        value={dateLabel}
        onChange={(e) => setDateLabel(e.target.value)}
        error={fieldErrors.dateLabel?.[0]}
      />
      <FormField
        label="Judul"
        name="title"
        type="text"
        placeholder="Pertama Bertemu"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title?.[0]}
      />
      <FormField
        label="Deskripsi (opsional)"
        name="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description?.[0]}
      />
      <FormField
        label="URL gambar (opsional)"
        name="imageUrl"
        type="text"
        placeholder="https://..."
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        error={fieldErrors.imageUrl?.[0]}
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
