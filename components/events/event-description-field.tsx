import { Textarea } from "@/components/ui/textarea";

export function EventDescriptionField({
  defaultValue,
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="description" className="text-sm leading-none font-medium">
        Deskripsi <span className="text-muted-foreground font-normal">(opsional)</span>
      </label>
      <Textarea
        id="description"
        name="description"
        rows={3}
        maxLength={500}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? "description-error" : undefined}
      />
      {error && (
        <p id="description-error" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
