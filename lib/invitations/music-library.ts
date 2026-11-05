/**
 * Built-in background tracks owners can pick instead of uploading (D-109).
 * Each file lives in `public/music/` and must be royalty-free with a
 * license that allows use on customers' invitations; record the license
 * next to the entry. The editor shows the library only when it has tracks,
 * and no track is added without its license. Keep files small (≈5MB or
 * less, 128 kbps): guests stream them on phones.
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

export const MUSIC_LIBRARY: readonly LibraryTrack[] = [
  {
    id: "chopin-nocturne-op9-no2",
    title: "Nocturne Op. 9 No. 2 – Chopin",
    artist: "Aya Higuchi",
    url: "/music/chopin-nocturne-op9-no2.mp3",
    license: "Public Domain (Musopen, musopen.org)",
  },
];

export function findLibraryTrack(id: string): LibraryTrack | null {
  return MUSIC_LIBRARY.find((track) => track.id === id) ?? null;
}
