"use client";

import type { ChangeEvent } from "react";
import { useActionState, useState } from "react";

import {
  confirmGuestImportAction,
  previewGuestImportAction,
  type ImportConfirmState,
  type ImportPreviewState,
} from "@/lib/guests/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const previewInitial: ImportPreviewState = {};
const confirmInitial: ImportConfirmState = {};

const ROW_STATUS_LABEL: Record<string, string> = {
  valid: "Siap diimpor",
  duplicate: "Duplikat — dilewati",
  invalid: "Tidak valid — dilewati",
};

export function CsvImportWizard({ eventId }: { eventId: string }) {
  const [previewState, previewAction, previewPending] = useActionState(
    previewGuestImportAction.bind(null, eventId),
    previewInitial,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmGuestImportAction.bind(null, eventId),
    confirmInitial,
  );
  const [csvText, setCsvText] = useState("");

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  if (confirmState.summary) {
    return (
      <div className="space-y-4 rounded-lg border p-4">
        <p className="font-medium">Impor selesai.</p>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>{confirmState.summary.imported} tamu berhasil diimpor.</li>
          <li>{confirmState.summary.skippedDuplicates} baris duplikat dilewati.</li>
          <li>{confirmState.summary.skippedInvalid} baris tidak valid dilewati.</li>
        </ul>
        <Button asChild>
          <a href={`/dashboard/events/${eventId}/guests`}>Kembali ke Daftar Tamu</a>
        </Button>
      </div>
    );
  }

  if (previewState.preview) {
    const { preview } = previewState;
    return (
      <div className="space-y-4">
        <FormError message={confirmState.error} />

        <div className="rounded-lg border p-4 text-sm">
          <p>
            <strong>{preview.importableCount}</strong> baris siap diimpor,{" "}
            <strong>{preview.duplicateCount}</strong> duplikat akan dilewati,{" "}
            <strong>{preview.invalidCount}</strong> baris tidak valid akan dilewati.
          </p>
        </div>

        {preview.rows.length > 0 && (
          <div className="max-h-96 overflow-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2">Baris</th>
                  <th className="p-2">Nama</th>
                  <th className="p-2">Telepon</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-t">
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2">{row.name ?? "—"}</td>
                    <td className="p-2">{row.phone ?? "—"}</td>
                    <td className="p-2">
                      {row.status === "invalid"
                        ? row.errors.join(", ")
                        : ROW_STATUS_LABEL[row.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <form action={confirmAction}>
            <input type="hidden" name="csvText" value={previewState.csvText} />
            <Button type="submit" disabled={confirmPending || preview.importableCount === 0}>
              {confirmPending
                ? "Mengimpor..."
                : `Konfirmasi Impor (${preview.importableCount} tamu)`}
            </Button>
          </form>
          <Button asChild variant="outline">
            <a href={`/dashboard/events/${eventId}/guests/import`}>Pilih File Lain</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={previewAction} className="space-y-4">
      <FormError message={previewState.error} />

      <div className="space-y-1.5">
        <label htmlFor="csvFile" className="text-sm leading-none font-medium">
          Pilih file CSV
        </label>
        <input
          id="csvFile"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="block text-sm"
        />
        <p className="text-muted-foreground text-xs">
          Kolom yang dikenali: nama, telepon, email, kategori, kuota, catatan. Baris pertama boleh
          berupa judul kolom. Hanya nama yang wajib diisi.
        </p>
      </div>

      <input type="hidden" name="csvText" value={csvText} />

      <Button type="submit" disabled={previewPending || !csvText.trim()}>
        {previewPending ? "Memeriksa..." : "Pratinjau Impor"}
      </Button>
    </form>
  );
}
