"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  removeCoverPhotoAction,
  saveThemeAction,
  uploadCoverPhotoAction,
} from "@/lib/editor/actions";
import type { EditorTheme } from "@/lib/editor/types";
import { GALLERY_UPLOAD_MAX_BYTES } from "@/lib/storage/limits";
import { useAutosave, type SaveStatus } from "@/components/editor/use-autosave";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/forms/form-error";
import { FormField } from "@/components/forms/form-field";

const MAX_UPLOAD_MB = Math.round(GALLERY_UPLOAD_MAX_BYTES / (1024 * 1024));
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

const EMPTY_THEME: EditorTheme = {
  primaryColor: null,
  secondaryColor: null,
  backgroundColor: null,
  textColor: null,
  accentColor: null,
  headingFont: null,
  bodyFont: null,
  scriptFont: null,
  backgroundImageUrl: null,
};

const COLOR_FIELDS: { key: keyof EditorTheme; label: string }[] = [
  { key: "primaryColor", label: "Warna utama" },
  { key: "secondaryColor", label: "Warna sekunder" },
  { key: "backgroundColor", label: "Warna latar" },
  { key: "textColor", label: "Warna teks" },
  { key: "accentColor", label: "Warna aksen" },
];

const FONT_FIELDS: { key: keyof EditorTheme; label: string }[] = [
  { key: "headingFont", label: "Font judul" },
  { key: "bodyFont", label: "Font teks" },
  { key: "scriptFont", label: "Font dekoratif" },
];

interface ThemeFormProps {
  eventId: string;
  value: EditorTheme | null;
  onSaved: (value: EditorTheme) => void;
  onStatusChange?: (status: SaveStatus, error?: string) => void;
}

export function ThemeForm({ eventId, value, onSaved, onStatusChange }: ThemeFormProps) {
  const [form, setForm] = useState<EditorTheme>(value ?? EMPTY_THEME);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const save = useCallback(
    async (current: EditorTheme) => {
      const result = await saveThemeAction(eventId, current);
      if (result.ok) {
        setFieldErrors({});
        onSaved(result.data);
        return { ok: true };
      }
      setFieldErrors(result.fieldErrors ?? {});
      return { ok: false, error: result.error };
    },
    [eventId, onSaved],
  );

  const { status, error } = useAutosave(form, save);

  useEffect(() => {
    onStatusChange?.(status, error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, error]);

  function setField(key: keyof EditorTheme, raw: string) {
    setForm((prev) => ({ ...prev, [key]: raw.trim() === "" ? null : raw }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Tema</h2>
        <p className="text-muted-foreground text-sm">
          Warna dan tipografi undangan. Kosongkan untuk memakai tampilan bawaan.
        </p>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-medium sm:col-span-2">Warna</legend>
        {COLOR_FIELDS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            name={key}
            type="text"
            placeholder="#7a5c3e"
            value={form[key] ?? ""}
            onChange={(e) => setField(key, e.target.value)}
            error={fieldErrors[key]?.[0]}
          />
        ))}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-medium sm:col-span-2">Tipografi</legend>
        {FONT_FIELDS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            name={key}
            type="text"
            placeholder="Georgia, serif"
            value={form[key] ?? ""}
            onChange={(e) => setField(key, e.target.value)}
            error={fieldErrors[key]?.[0]}
          />
        ))}
      </fieldset>

      <CoverPhotoField
        eventId={eventId}
        value={form.backgroundImageUrl}
        onChange={(url) => setField("backgroundImageUrl", url ?? "")}
        error={fieldErrors.backgroundImageUrl?.[0]}
      />
    </div>
  );
}

function CoverPhotoField({
  eventId,
  value,
  onChange,
  error,
}: {
  eventId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [actionError, setActionError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function upload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFieldErrors({ file: ["Pilih berkas gambar untuk diunggah."] });
      return;
    }

    setActionError(undefined);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("file", file);
    if (value) formData.set("previousUrl", value);

    startTransition(async () => {
      const result = await uploadCoverPhotoAction(eventId, formData);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setActionError(result.error);
        return;
      }
      onChange(result.data.publicUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function remove() {
    if (!value) return;
    setActionError(undefined);
    startTransition(async () => {
      const result = await removeCoverPhotoAction(eventId, value);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      onChange(null);
    });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Foto latar (opsional)</legend>
      <p className="text-muted-foreground text-xs">
        Tampil sebagai foto sampul di bagian Hero undangan. Kosongkan untuk memakai tampilan warna
        bawaan.
      </p>
      <FormError message={actionError} />

      {value && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- our own uploaded storage object. */}
          <img
            src={value}
            alt="Pratinjau foto latar"
            className="h-20 w-20 rounded-md border object-cover"
          />
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={remove}>
            {pending ? "Menghapus..." : "Hapus Foto"}
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="coverPhotoFile" className="text-sm leading-none font-medium">
          {value ? "Ganti berkas gambar" : "Berkas gambar"}
        </label>
        <input
          ref={fileInputRef}
          id="coverPhotoFile"
          name="file"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="border-input file:bg-secondary block w-full rounded-md border text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
          aria-invalid={!!(fieldErrors.file?.[0] ?? error)}
          aria-describedby={
            (fieldErrors.file?.[0] ?? error) ? "coverPhotoFile-error" : "coverPhotoFile-hint"
          }
        />
        {(fieldErrors.file?.[0] ?? error) ? (
          <p id="coverPhotoFile-error" className="text-destructive text-xs">
            {fieldErrors.file?.[0] ?? error}
          </p>
        ) : (
          <p id="coverPhotoFile-hint" className="text-muted-foreground text-xs">
            JPEG, PNG, WebP, atau GIF. Maksimal {MAX_UPLOAD_MB}MB.
          </p>
        )}
      </div>

      <Button type="button" size="sm" onClick={upload} disabled={pending}>
        {pending ? "Mengunggah..." : "Unggah Foto Latar"}
      </Button>
    </fieldset>
  );
}
