/**
 * Built-in background tracks owners can pick instead of uploading (D-109).
 * Each file lives in `public/music/` and must be royalty-free with a
 * license that allows use on customers' invitations; record the license
 * next to the entry. The list starts empty: the editor shows the library
 * only once it has tracks, and no track is added without its license.
 */
export interface LibraryTrack {
  id: string;
  title: string;
  /** Who made it, as the license requires attribution. */
  artist: string;
  /** Path under /public, e.g. "/music/nama-lagu.mp3". */
  url: string;
  /** License name and source link, for the record. */
  license: string;
}

export const MUSIC_LIBRARY: readonly LibraryTrack[] = [];

export function findLibraryTrack(id: string): LibraryTrack | null {
  return MUSIC_LIBRARY.find((track) => track.id === id) ?? null;
}
