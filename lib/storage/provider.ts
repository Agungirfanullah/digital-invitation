import "server-only";

import { createSupabaseStorageProvider } from "@/lib/storage/supabase-provider";
import type { StorageProvider } from "@/lib/storage/types";

/**
 * The single seam business logic (lib/editor/service.ts) depends on.
 * Supabase Storage is the only implementation today (docs/DECISIONS.md
 * D-006), but callers never import `supabase-provider.ts` directly — a
 * future alternative provider only needs to be swapped in here.
 */
export function getStorageProvider(): StorageProvider {
  return createSupabaseStorageProvider();
}
