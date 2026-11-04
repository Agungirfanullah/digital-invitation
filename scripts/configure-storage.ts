/**
 * Applies the storage bucket's settings (D-109): public read, a 6MB object
 * ceiling, and an allowlist of the file types the app uploads (images and,
 * for background music, MP3/M4A audio). The app still validates every file's
 * real content; this is the second line of defense.
 *
 *   npm run storage:configure
 *
 * Uses .env.local by default. To configure production, set
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
 * SUPABASE_STORAGE_BUCKET to production values in the same terminal first.
 */
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
];
const FILE_SIZE_LIMIT_BYTES = 6_000_000;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "invitation-assets";
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");
    process.exitCode = 1;
    return;
  }

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.storage.updateBucket(bucket, {
    public: true,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    fileSizeLimit: FILE_SIZE_LIMIT_BYTES,
  });
  if (error) {
    console.error(`Gagal mengatur bucket ${bucket}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Bucket ${bucket} diatur: ${ALLOWED_MIME_TYPES.join(", ")}; maks 6MB.`);
}

void main();
