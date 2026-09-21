import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { StorageProviderError } from "@/lib/storage/errors";
import type { StorageProvider } from "@/lib/storage/types";

/**
 * The only module that imports `createSupabaseServiceClient()` for
 * gallery uploads — the service-role key never reaches this function's
 * caller, let alone the browser (`createSupabaseServiceClient` is itself
 * `server-only` and only ever called from server code; see
 * lib/supabase/server.ts's own doc comment).
 */
export function createSupabaseStorageProvider(): StorageProvider {
  const bucket = getServerEnv().SUPABASE_STORAGE_BUCKET;
  const client = createSupabaseServiceClient();

  return {
    async upload(path, body, contentType) {
      const { error } = await client.storage.from(bucket).upload(path, body, {
        contentType,
        upsert: false,
      });
      if (error) throw new StorageProviderError(error);

      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return { publicUrl: data.publicUrl };
    },

    async remove(path) {
      const { error } = await client.storage.from(bucket).remove([path]);
      // Supabase's remove() does not itself error for an already-missing
      // object, so any error here is a genuine provider/network failure.
      if (error) throw new StorageProviderError(error);
    },
  };
}
