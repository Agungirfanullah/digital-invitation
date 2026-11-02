"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventType } from "@prisma/client";

import { saveIdentityProfileAction } from "@/lib/editor/actions";
import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import type { IdentityProfileData } from "@/lib/event-types/identity";
import {
  getIdentityFieldGroups,
  type IdentityFieldDef,
  type IdentityFieldKind,
} from "@/lib/event-types/identity-fields";
import { useAutosave, type SaveStatus } from "@/components/editor/use-autosave";
import { IdentityPhotoField } from "@/components/editor/sections/identity-photo-field";
import { FormField } from "@/components/forms/form-field";
import { EditorSectionHeader } from "@/components/editor/section-header";

/** An identity with a profile (every family except GENERIC). */
type ProfileIdentity = Exclude<IdentityProfileData, { family: "GENERIC" }>;
type FieldValue = string | number | null;

interface IdentityFormProps {
  eventId: string;
  type: EventType;
  value: ProfileIdentity;
  onSaved: (value: IdentityProfileData) => void;
  onStatusChange?: (status: SaveStatus, error?: string) => void;
}

function readField(identity: ProfileIdentity, key: string): FieldValue {
  return (identity.data as unknown as Record<string, FieldValue>)[key] ?? null;
}

/** Empty input → null (the server schemas validate `value | null`, never ""). */
function parseFieldInput(raw: string, kind: IdentityFieldKind): FieldValue {
  if (raw.trim() === "") return null;
  if (kind === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return raw;
}

function Field({
  def,
  value,
  error,
  onChange,
}: {
  def: IdentityFieldDef;
  value: FieldValue;
  error?: string;
  onChange: (raw: string) => void;
}) {
  return (
    <FormField
      label={def.label}
      name={def.key}
      type={def.kind}
      inputMode={def.kind === "number" ? "numeric" : undefined}
      min={def.kind === "number" ? 0 : undefined}
      placeholder={def.placeholder}
      hint={def.hint}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
}

/**
 * The one identity editor for every identity family — its fields come from
 * `getIdentityFieldGroups(type)`, so the editor never shows another type's
 * form (e.g. no bride/groom fields for BIRTHDAY). Autosaves partial drafts;
 * required information is checked at publish time.
 */
export function IdentityForm({ eventId, type, value, onSaved, onStatusChange }: IdentityFormProps) {
  const config = EVENT_TYPE_CONFIG[type];
  const groups = getIdentityFieldGroups(type);
  const [form, setForm] = useState<ProfileIdentity>(value);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const save = useCallback(
    async (current: ProfileIdentity) => {
      const result = await saveIdentityProfileAction(eventId, current);
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

  function setPhoto(key: string, url: string | null) {
    setForm((prev) => ({ ...prev, data: { ...prev.data, [key]: url } }) as ProfileIdentity);
  }

  function onFieldChange(def: IdentityFieldDef, raw: string) {
    setForm(
      (prev) =>
        ({
          ...prev,
          data: { ...prev.data, [def.key]: parseFieldInput(raw, def.kind) },
        }) as ProfileIdentity,
    );
  }

  return (
    <div className="space-y-6">
      <EditorSectionHeader section="identity">
        <h2 className="text-xl font-semibold tracking-tight">{config.identityNavLabel}</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Informasi ini tampil di bagian sampul undangan.
        </p>
      </EditorSectionHeader>

      <div className="grid gap-5 @xl:grid-cols-2">
        {groups.map((group, index) => (
          <fieldset
            key={group.legend ?? index}
            className={
              group.legend
                ? "border-border/60 bg-card space-y-4 rounded-2xl border px-5 pt-2 pb-5 shadow-xs"
                : "space-y-4"
            }
          >
            {group.legend && (
              <legend className="bg-primary/10 text-primary -ml-1 rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
                {group.legend}
              </legend>
            )}
            {group.fields.map((def) =>
              def.kind === "photo" ? (
                <IdentityPhotoField
                  key={def.key}
                  eventId={eventId}
                  label={def.label}
                  name={def.key}
                  value={
                    typeof readField(form, def.key) === "string"
                      ? String(readField(form, def.key))
                      : null
                  }
                  onChange={(url) => setPhoto(def.key, url)}
                  error={fieldErrors[def.key]?.[0]}
                />
              ) : (
                <Field
                  key={def.key}
                  def={def}
                  value={readField(form, def.key)}
                  error={fieldErrors[def.key]?.[0]}
                  onChange={(raw) => onFieldChange(def, raw)}
                />
              ),
            )}
          </fieldset>
        ))}
      </div>
    </div>
  );
}
