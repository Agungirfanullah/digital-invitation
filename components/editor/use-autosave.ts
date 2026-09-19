"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Debounced autosave for a single controlled value. Not per-keystroke:
 * the save only fires `delayMs` after the value stops changing. Single-
 * editor oriented — this only protects against a *local* stale write (the
 * user kept typing while an earlier save for this same field was still in
 * flight), not concurrent edits from another tab/user. That's an
 * explicit, documented scope boundary for this foundation, not an
 * oversight.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<AutosaveResult>,
  delayMs = 800,
): { status: SaveStatus; error?: string } {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const latestValueRef = useRef(value);
  const savedValueRef = useRef(value);
  const isFirstRender = useRef(true);
  const saveRef = useRef(save);

  // Keep the latest `save` callback available to the pending timeout
  // without making it a `useEffect` dependency below (which would
  // otherwise re-arm the debounce whenever the caller passes a new
  // function reference, even with no actual value change). Refs must be
  // written in an effect, not during render, hence the separate effect.
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    latestValueRef.current = value;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      savedValueRef.current = value;
      return;
    }

    if (JSON.stringify(value) === JSON.stringify(savedValueRef.current)) {
      return;
    }

    setStatus("saving");

    const timeoutId = setTimeout(async () => {
      const valueAtSaveTime = latestValueRef.current;
      const result = await saveRef.current(valueAtSaveTime);

      // If the user kept typing after this save was scheduled, a newer
      // debounce cycle already owns the outcome — don't let this stale
      // response overwrite it either way.
      if (JSON.stringify(latestValueRef.current) !== JSON.stringify(valueAtSaveTime)) {
        return;
      }

      if (result.ok) {
        savedValueRef.current = valueAtSaveTime;
        setStatus("saved");
        setError(undefined);
      } else {
        setStatus("error");
        setError(result.error);
      }
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return { status, error };
}
