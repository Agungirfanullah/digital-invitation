import { GUEST_CATEGORY_OPTIONS } from "@/lib/guests/labels";
import { Select } from "@/components/ui/select";

export function GuestCategoryField({
  defaultValue,
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="category" className="text-sm leading-none font-medium">
        Kategori
      </label>
      <Select
        id="category"
        name="category"
        defaultValue={defaultValue ?? "OTHER"}
        aria-invalid={!!error}
        aria-describedby={error ? "category-error" : undefined}
      >
        {GUEST_CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error && (
        <p id="category-error" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
