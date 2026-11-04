"use client";

import { useRef, useState, useTransition } from "react";

import {
  chooseLibraryMusicAction,
  removeMusicAction,
  uploadMusicAction,
} from "@/lib/editor/actions";
import {
  MUSIC_ACCEPT,
  MUSIC_UPLOAD_MAX_BYTES,
  type InvitationMusic,
} from "@/lib/invitations/music";
import { MUSIC_LIBRARY } from "@/lib/invitations/music-library";
import { EditorSectionHeader } from "@/components/editor/section-header";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const MAX_MB = Math.round(MUSIC_UPLOAD_MAX_BYTES / (1024 * 1024));

/**
 * Background music (D-109): one track per invitation, uploaded or picked
 * from the built-in library. Each change is saved at once (no autosave
 * delay); the live preview never plays it.
 */
export function MusicForm({
  eventId,
  value,
  onChange,
}: {
  eventId: string;
  value: InvitationMusic | null;
  onChange: (music: InvitationMusic | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<"upload" | "remove" | "library" | null>(null);
  const [pending, startTransition] = useTransition();

  function run(kind: "upload" | "remove" | "library", task: () => Promise<void>) {
    setError(undefined);
    setBusy(kind);
    startTransition(async () => {
      await task();
      setBusy(null);
    });
  }

  function handleFile() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    if (file.size > MUSIC_UPLOAD_MAX_BYTES) {
      setError(`Ukuran lagu maksimal ${MAX_MB}MB. Coba kompres ke MP3 128 kbps.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    run("upload", async () => {
      const result = await uploadMusicAction(eventId, formData);
      if (inputRef.current) inputRef.current.value = "";
      if (result.ok) onChange(result.data);
      else setError(result.fieldErrors?.file?.[0] ?? result.error);
    });
  }

  return (
    <div className="space-y-6">
      <EditorSectionHeader section="music">
        <h2 className="text-xl font-semibold tracking-tight">Musik</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Lagu diputar setelah tamu menekan &ldquo;Buka Undangan&rdquo;, dan tamu bisa menjeda kapan
          saja. Pastikan kamu berhak memakai lagu yang diunggah.
        </p>
      </EditorSectionHeader>

      <FormError message={error} />

      <section
        aria-label="Lagu saat ini"
        className="border-border/60 bg-card space-y-3 rounded-2xl border p-5 shadow-xs"
      >
        {value ? (
          <>
            <p className="text-sm">
              <span className="text-muted-foreground">Lagu saat ini: </span>
              <span className="font-medium">{value.title ?? "Tanpa judul"}</span>
            </p>
            {/* Lets the owner hear the track; the live preview stays silent. */}
            <audio controls preload="none" src={value.url} className="w-full">
              <track kind="captions" />
            </audio>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                run("remove", async () => {
                  const result = await removeMusicAction(eventId);
                  if (result.ok) onChange(null);
                  else setError(result.error);
                })
              }
            >
              {busy === "remove" ? "Menghapus..." : "Hapus musik"}
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Belum ada musik. Undangan tampil tanpa suara.
          </p>
        )}
      </section>

      <section aria-label="Unggah lagu" className="space-y-2">
        <label htmlFor="music-file" className="text-sm font-medium">
          {value ? "Ganti dengan lagu lain" : "Unggah lagu"}
        </label>
        <input
          ref={inputRef}
          id="music-file"
          type="file"
          accept={MUSIC_ACCEPT}
          disabled={pending}
          onChange={handleFile}
          aria-describedby="music-file-hint"
          className="file:bg-primary file:text-primary-foreground block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
        />
        <p id="music-file-hint" className="text-muted-foreground text-xs">
          {busy === "upload" ? "Mengunggah..." : `MP3 atau M4A, maksimal ${MAX_MB}MB.`}
        </p>
      </section>

      {MUSIC_LIBRARY.length > 0 && (
        <section aria-label="Lagu bawaan" className="space-y-2">
          <h3 className="text-sm font-medium">Atau pilih lagu bawaan</h3>
          <ul className="space-y-2">
            {MUSIC_LIBRARY.map((track) => (
              <li
                key={track.id}
                className="border-border/60 bg-card flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
              >
                <span className="text-sm">
                  <span className="font-medium">{track.title}</span>
                  <span className="text-muted-foreground"> · {track.artist}</span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={value?.url === track.url ? "secondary" : "outline"}
                  disabled={pending || value?.url === track.url}
                  onClick={() =>
                    run("library", async () => {
                      const result = await chooseLibraryMusicAction(eventId, track.id);
                      if (result.ok) onChange(result.data);
                      else setError(result.error);
                    })
                  }
                >
                  {value?.url === track.url ? "Dipakai" : "Pakai"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
