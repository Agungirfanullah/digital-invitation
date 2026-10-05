"use client";

import { useState, useTransition, type ReactNode } from "react";

import { selectTemplateAction } from "@/lib/editor/actions";
import type { EditorTemplateOption } from "@/lib/editor/types";
import { FormError } from "@/components/forms/form-error";
import { PhoneFrame } from "@/components/invitation/phone-frame";
import { Button } from "@/components/ui/button";

interface TemplateFormProps {
  eventId: string;
  templates: EditorTemplateOption[];
  /** Server-rendered demo of each implemented template, keyed by slug. */
  previews: Record<string, ReactNode>;
  value: string | null;
  onSaved: (templateKey: string | null) => void;
}

export function TemplateForm({ eventId, templates, previews, value, onSaved }: TemplateFormProps) {
  const [selected, setSelected] = useState(value);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const activeName = templates.find((template) => template.slug === selected)?.name;

  function selectTemplate(templateSlug: string) {
    setError(undefined);
    setPendingSlug(templateSlug);
    startTransition(async () => {
      const result = await selectTemplateAction(eventId, { templateSlug });
      setPendingSlug(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelected(result.data.templateKey);
      onSaved(result.data.templateKey);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Tema</h2>
        <p className="text-muted-foreground text-sm">
          Pilih tampilan undangan. Isi acaramu tetap sama, hanya gayanya yang berganti.
        </p>
      </div>

      <div className="bg-secondary/60 rounded-lg px-4 py-3">
        <p className="text-muted-foreground text-xs">Tema Aktif</p>
        <p className="font-medium">{activeName ?? "Belum dipilih — memakai tampilan bawaan"}</p>
      </div>

      <FormError message={error} />

      <ul className="grid grid-cols-2 gap-3">
        {templates.map((template) => {
          const isSelected = selected === template.slug;
          const isPending = pendingSlug === template.slug;
          const preview = template.implemented ? previews[template.slug] : null;

          return (
            <li key={template.slug} className="bg-card flex flex-col gap-3 rounded-xl border p-3">
              <div className="relative mx-auto w-full max-w-[200px]">
                {isSelected && (
                  <span className="bg-primary text-primary-foreground absolute top-2 right-2 z-20 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                    Dipakai
                  </span>
                )}
                {preview ? (
                  <div inert>
                    <PhoneFrame heightClassName="h-[300px]" compact>
                      {preview}
                    </PhoneFrame>
                  </div>
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-[300px] items-center justify-center rounded-3xl text-xs">
                    Segera hadir
                  </div>
                )}
              </div>

              <p className="text-sm font-medium">{template.name}</p>

              <div className="mt-auto flex flex-col gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? "secondary" : "default"}
                  disabled={!template.implemented || isSelected || pending}
                  aria-pressed={isSelected}
                  aria-label={`Aktifkan ${template.name}`}
                  onClick={() => selectTemplate(template.slug)}
                >
                  {isPending ? "Mengaktifkan..." : isSelected ? "Terpilih" : "Aktifkan"}
                </Button>
                {template.implemented && (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`/demo/${template.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Lihat demo ${template.name}`}
                    >
                      Lihat Demo
                    </a>
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
