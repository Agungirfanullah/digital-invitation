/**
 * Background music (D-109). Client-safe and pure: the setting lives in the
 * untyped `Event.settings` JSON under `music`, next to `openingEnabled`, so
 * no schema change is needed.
 */

export type MusicSource = "upload" | "library";

export interface InvitationMusic {
  /** Public URL of the audio file (own storage, or a built-in track under /music). */
  url: string;
  title: string | null;
  source: MusicSource;
}

/**
 * 4MB: about four minutes of MP3 at 128 kbps. Uploads go through a Server
 * Action, and Vercel refuses any function request body over 4.5MB before
 * the app sees it, so the cap stays below that with room for the form
 * overhead.
 */
export const MUSIC_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const MUSIC_ACCEPT = "audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a";
export const MUSIC_TITLE_MAX_LENGTH = 100;

function isMusic(value: unknown): value is InvitationMusic {
  if (!value || typeof value !== "object") return false;
  const music = value as Record<string, unknown>;
  return (
    typeof music.url === "string" &&
    music.url.length > 0 &&
    (music.title === null || typeof music.title === "string") &&
    (music.source === "upload" || music.source === "library")
  );
}

/** Reads the music setting; anything malformed counts as "no music". */
export function resolveMusic(settings: unknown): InvitationMusic | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const music = (settings as Record<string, unknown>).music;
  return isMusic(music) ? { url: music.url, title: music.title, source: music.source } : null;
}

/** Returns new settings with `music` set (or removed for null), keeping every other key. */
export function mergeMusic(
  settings: unknown,
  music: InvitationMusic | null,
): Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? { ...(settings as Record<string, unknown>) }
      : {};
  if (music) base.music = music;
  else delete base.music;
  return base;
}

/** Dispatched by the Opening gate when a guest opens the invitation (a user gesture). */
export const INVITATION_REVEAL_EVENT = "invitation:reveal";
