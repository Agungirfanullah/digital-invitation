"use client";

import { useState, useTransition } from "react";

import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/lib/editor/actions";
import type { EditorSchedule } from "@/lib/editor/types";
import { formatIndonesianDate, formatTimeRange } from "@/lib/invitations/format";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

interface ScheduleFormProps {
  eventId: string;
  items: EditorSchedule[];
  onChange: (items: EditorSchedule[]) => void;
}

export function ScheduleForm({ eventId, items, onChange }: ScheduleFormProps) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [pendingDeleteId, startDeleteTransition] = useTransition();

  function handleCreated(item: EditorSchedule) {
    onChange([...items, item]);
    setEditingId(null);
  }

  function handleUpdated(item: EditorSchedule) {
    onChange(items.map((existing) => (existing.id === item.id ? item : existing)));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setDeleteError(undefined);
    startDeleteTransition(async () => {
      const result = await deleteScheduleAction(eventId, id);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      onChange(items.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Jadwal Acara</h2>
        <p className="text-muted-foreground text-sm">
          Rangkaian acara seperti akad, resepsi, atau acara lainnya.
        </p>
      </div>

      <FormError message={deleteError} />

      {items.length === 0 && editingId !== "new" && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Belum ada jadwal acara.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <ScheduleItemForm
                eventId={eventId}
                initial={item}
                onSaved={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={item.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatIndonesianDate(item.date)} ·{" "}
                    {formatTimeRange(item.startTime, item.endTime)}
                  </p>
                  {item.venue && <p className="text-muted-foreground text-sm">{item.venue.name}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(item.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pendingDeleteId}
                    onClick={() => handleDelete(item.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      {editingId === "new" ? (
        <ScheduleItemForm
          eventId={eventId}
          initial={null}
          onSaved={handleCreated}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setEditingId("new")}>
          Tambah Jadwal
        </Button>
      )}
    </div>
  );
}

function ScheduleItemForm({
  eventId,
  initial,
  onSaved,
  onCancel,
}: {
  eventId: string;
  initial: EditorSchedule | null;
  onSaved: (item: EditorSchedule) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [hasVenue, setHasVenue] = useState(!!initial?.venue);
  const [venueName, setVenueName] = useState(initial?.venue?.name ?? "");
  const [venueAddress, setVenueAddress] = useState(initial?.venue?.address ?? "");
  const [venueMapUrl, setVenueMapUrl] = useState(initial?.venue?.mapUrl ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(undefined);
    const input = {
      title,
      description: description.trim() === "" ? null : description,
      date,
      startTime,
      endTime,
      venueName: hasVenue && venueName.trim() !== "" ? venueName : null,
      venueAddress: hasVenue && venueAddress.trim() !== "" ? venueAddress : null,
      venueMapUrl: hasVenue && venueMapUrl.trim() !== "" ? venueMapUrl : null,
      venueLatitude: null,
      venueLongitude: null,
    };

    startTransition(async () => {
      const result = initial
        ? await updateScheduleAction(eventId, initial.id, input)
        : await createScheduleAction(eventId, input);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error);
        return;
      }
      onSaved(result.data);
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormError message={error} />

      <FormField
        label="Judul acara"
        name="title"
        type="text"
        placeholder="Akad Nikah"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title?.[0]}
      />
      <FormField
        label="Catatan (opsional)"
        name="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description?.[0]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          label="Tanggal"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={fieldErrors.date?.[0]}
        />
        <FormField
          label="Mulai"
          name="startTime"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          error={fieldErrors.startTime?.[0]}
        />
        <FormField
          label="Selesai"
          name="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          error={fieldErrors.endTime?.[0]}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hasVenue}
          onChange={(e) => setHasVenue(e.target.checked)}
          className="h-4 w-4"
        />
        Sertakan lokasi
      </label>

      {hasVenue && (
        <div className="space-y-4 border-t pt-4">
          <FormField
            label="Nama lokasi"
            name="venueName"
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            error={fieldErrors.venueName?.[0]}
          />
          <FormField
            label="Alamat"
            name="venueAddress"
            type="text"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            error={fieldErrors.venueAddress?.[0]}
          />
          <FormField
            label="URL peta (opsional)"
            name="venueMapUrl"
            type="text"
            placeholder="https://maps.google.com/..."
            value={venueMapUrl}
            onChange={(e) => setVenueMapUrl(e.target.value)}
            error={fieldErrors.venueMapUrl?.[0]}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
      </div>
    </div>
  );
}
