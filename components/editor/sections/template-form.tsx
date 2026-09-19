"use client";

import { useState, useTransition } from "react";

import { selectTemplateAction } from "@/lib/editor/actions";
import type { EditorTemplateOption } from "@/lib/editor/types";
import { FormError } from "@/components/forms/form-error";
import { cn } from "@/lib/utils";

interface TemplateFormProps {
  eventId: string;
  templates: EditorTemplateOption[];
  value: string | null;
  onSaved: (templateKey: string | null) => void;
}

export function TemplateForm({ eventId, templates, value, onSaved }: TemplateFormProps) {
  const [selected, setSelected] = useState(value);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function selectTemplate(templateSlug: string) {
    setError(undefined);
    startTransition(async () => {
      const result = await selectTemplateAction(eventId, { templateSlug });
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
        <h2 className="text-lg font-semibold tracking-tight">Template</h2>
        <p className="text-muted-foreground text-sm">
          Pilih tampilan undangan. Template lain akan hadir secara bertahap.
        </p>
      </div>

      <FormError message={error} />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((template) => {
          const isSelected = selected === template.slug;
          return (
            <li key={template.slug}>
              <button
                type="button"
                disabled={!template.implemented || pending}
                onClick={() => selectTemplate(template.slug)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  isSelected ? "border-primary bg-accent" : "border-border hover:bg-accent/50",
                  !template.implemented && "cursor-not-allowed opacity-50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{template.name}</p>
                  {isSelected && <span className="text-primary text-xs font-medium">Dipakai</span>}
                </div>
                {!template.implemented && (
                  <p className="text-muted-foreground mt-1 text-xs">Segera hadir</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
