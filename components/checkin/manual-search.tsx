"use client";

import { useState, useTransition } from "react";

import { searchGuestsForCheckInAction } from "@/lib/checkin/actions";
import type { CheckInSearchResultItem } from "@/lib/checkin/types";
import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ManualSearchProps {
  eventId: string;
  onSelect: (guestId: string) => void;
  disabled?: boolean;
}

/**
 * Event-scoped, server-backed search (`searchGuestsForCheckInAction` —
 * see lib/checkin/service.ts's `searchGuestsForCheckIn()`). Results show
 * only name/category/check-in status — never phone/email/notes, per this
 * phase's explicit PII-minimization requirement.
 */
export function ManualSearch({ eventId, onSelect, disabled }: ManualSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckInSearchResultItem[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length === 0) {
      setResults([]);
      setSearched(false);
      setError(undefined);
      return;
    }

    startTransition(async () => {
      const result = await searchGuestsForCheckInAction(eventId, value);
      setSearched(true);
      if (!result.ok) {
        setError(result.error);
        setResults([]);
        return;
      }
      setError(undefined);
      setResults(result.results);
    });
  }

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Cari nama tamu..."
        value={query}
        onChange={(event) => runSearch(event.target.value)}
        disabled={disabled}
        aria-label="Cari tamu"
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      {pending && <p className="text-muted-foreground text-sm">Mencari...</p>}

      {!pending && searched && results.length === 0 && !error && (
        <p className="text-muted-foreground text-sm">Tidak ada tamu yang cocok.</p>
      )}

      {!pending && results.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {results.map((item) => (
            <li key={item.guestId} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.guestName}</p>
                <p className="text-muted-foreground text-xs">
                  {GUEST_CATEGORY_LABELS[item.category]}
                  {item.isCheckedIn && " · Sudah check-in"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => onSelect(item.guestId)}
              >
                Pilih
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
