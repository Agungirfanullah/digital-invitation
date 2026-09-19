"use client";

import { useCallback, useEffect, useState } from "react";

import { saveWeddingProfileAction } from "@/lib/editor/actions";
import type { EditorWeddingProfile } from "@/lib/editor/types";
import { useAutosave, type SaveStatus } from "@/components/editor/use-autosave";
import { FormField } from "@/components/forms/form-field";

const EMPTY_PROFILE: EditorWeddingProfile = {
  brideFullName: null,
  brideNickname: null,
  brideFather: null,
  brideMother: null,
  brideInstagram: null,
  groomFullName: null,
  groomNickname: null,
  groomFather: null,
  groomMother: null,
  groomInstagram: null,
};

interface CoupleFormProps {
  eventId: string;
  value: EditorWeddingProfile | null;
  onSaved: (value: EditorWeddingProfile) => void;
  onStatusChange?: (status: SaveStatus, error?: string) => void;
}

type PersonPrefix = "bride" | "groom";

function PersonFields({
  prefix,
  label,
  form,
  fieldErrors,
  onFieldChange,
}: {
  prefix: PersonPrefix;
  label: string;
  form: EditorWeddingProfile;
  fieldErrors: Record<string, string[]>;
  onFieldChange: (key: keyof EditorWeddingProfile, raw: string) => void;
}) {
  const fullNameKey = `${prefix}FullName` as const;
  const nicknameKey = `${prefix}Nickname` as const;
  const fatherKey = `${prefix}Father` as const;
  const motherKey = `${prefix}Mother` as const;
  const instagramKey = `${prefix}Instagram` as const;

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">{label}</legend>
      <FormField
        label="Nama lengkap"
        name={fullNameKey}
        type="text"
        value={form[fullNameKey] ?? ""}
        onChange={(e) => onFieldChange(fullNameKey, e.target.value)}
        error={fieldErrors[fullNameKey]?.[0]}
      />
      <FormField
        label="Nama panggilan"
        name={nicknameKey}
        type="text"
        value={form[nicknameKey] ?? ""}
        onChange={(e) => onFieldChange(nicknameKey, e.target.value)}
        error={fieldErrors[nicknameKey]?.[0]}
      />
      <FormField
        label="Nama ayah"
        name={fatherKey}
        type="text"
        value={form[fatherKey] ?? ""}
        onChange={(e) => onFieldChange(fatherKey, e.target.value)}
        error={fieldErrors[fatherKey]?.[0]}
      />
      <FormField
        label="Nama ibu"
        name={motherKey}
        type="text"
        value={form[motherKey] ?? ""}
        onChange={(e) => onFieldChange(motherKey, e.target.value)}
        error={fieldErrors[motherKey]?.[0]}
      />
      <FormField
        label="Instagram"
        name={instagramKey}
        type="text"
        placeholder="tanpa @"
        value={form[instagramKey] ?? ""}
        onChange={(e) => onFieldChange(instagramKey, e.target.value)}
        error={fieldErrors[instagramKey]?.[0]}
      />
    </fieldset>
  );
}

export function CoupleForm({ eventId, value, onSaved, onStatusChange }: CoupleFormProps) {
  const [form, setForm] = useState<EditorWeddingProfile>(value ?? EMPTY_PROFILE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const save = useCallback(
    async (current: EditorWeddingProfile) => {
      const result = await saveWeddingProfileAction(eventId, current);
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
    // onStatusChange intentionally excluded: the shell passes a stable
    // setter, and including it would re-run this whenever the shell
    // re-renders for unrelated reasons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, error]);

  function onFieldChange(key: keyof EditorWeddingProfile, raw: string) {
    setForm((prev) => ({ ...prev, [key]: raw.trim() === "" ? null : raw }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Mempelai</h2>
        <p className="text-muted-foreground text-sm">
          Informasi ini tampil di bagian sampul undangan.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <PersonFields
          prefix="bride"
          label="Mempelai Wanita"
          form={form}
          fieldErrors={fieldErrors}
          onFieldChange={onFieldChange}
        />
        <PersonFields
          prefix="groom"
          label="Mempelai Pria"
          form={form}
          fieldErrors={fieldErrors}
          onFieldChange={onFieldChange}
        />
      </div>
    </div>
  );
}
