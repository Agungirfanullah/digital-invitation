import { EVENT_TYPE_OPTIONS } from "@/lib/events/labels";
import { Select } from "@/components/ui/select";

export function EventTypeField({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="type" className="text-sm leading-none font-medium">
        Jenis acara
      </label>
      <Select
        id="type"
        name="type"
        defaultValue={defaultValue ?? "WEDDING"}
        aria-invalid={!!error}
        aria-describedby={error ? "type-error" : undefined}
      >
        {EVENT_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error && (
        <p id="type-error" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
