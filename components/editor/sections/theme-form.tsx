"use client";

import { useCallback, useEffect, useState } from "react";

import { saveThemeAction } from "@/lib/editor/actions";
import type { EditorTheme } from "@/lib/editor/types";
import { useAutosave, type SaveStatus } from "@/components/editor/use-autosave";
import { FormField } from "@/components/forms/form-field";

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

      <FormField
        label="URL gambar latar (opsional)"
        name="backgroundImageUrl"
        type="text"
        placeholder="https://..."
        value={form.backgroundImageUrl ?? ""}
        onChange={(e) => setField("backgroundImageUrl", e.target.value)}
        error={fieldErrors.backgroundImageUrl?.[0]}
      />
    </div>
  );
}
