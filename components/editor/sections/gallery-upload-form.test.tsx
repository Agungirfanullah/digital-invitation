import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const uploadGalleryImageAction = vi.fn();

vi.mock("@/lib/editor/actions", () => ({
  uploadGalleryImageAction: (...args: unknown[]) => uploadGalleryImageAction(...args),
}));

import { GalleryImageUploadForm } from "@/components/editor/sections/gallery-upload-form";
import type { EditorGalleryItem } from "@/lib/editor/types";

function png(name: string, size = 1000, type = "image/png") {
  return new File([new Uint8Array(size)], name, { type });
}

function item(name: string): EditorGalleryItem {
  return {
    id: `item-${name}`,
    type: "IMAGE",
    url: `https://storage.test/${name}`,
    thumbnailUrl: null,
    caption: null,
    sortOrder: 0,
  } as EditorGalleryItem;
}

function setup() {
  const onUploaded = vi.fn();
  render(<GalleryImageUploadForm eventId="event-1" onUploaded={onUploaded} />);
  const input = screen.getByLabelText("Berkas gambar") as HTMLInputElement;
  const select = (...files: File[]) => fireEvent.change(input, { target: { files } });
  return { onUploaded, input, select };
}

function ok(name: string) {
  return { ok: true, data: item(name) };
}

beforeEach(() => {
  uploadGalleryImageAction.mockReset();
});

describe("GalleryImageUploadForm — selecting", () => {
  it("accepts several files at once", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("multiple");
  });

  it("lists the chosen photos and offers to upload them all", () => {
    const { select } = setup();
    select(png("a.png"), png("b.png"), png("c.png"));

    expect(screen.getByText("a.png")).toBeInTheDocument();
    expect(screen.getByText("c.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah 3 Foto" })).toBeInTheDocument();
  });

  it("keeps the plain button label and the caption field for a single photo", () => {
    const { select } = setup();
    select(png("a.png"));

    expect(screen.getByRole("button", { name: "Unggah Foto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Keterangan (opsional)")).toBeInTheDocument();
  });

  it("replaces the caption field with a hint when several photos are chosen", () => {
    const { select } = setup();
    select(png("a.png"), png("b.png"));

    expect(screen.queryByLabelText("Keterangan (opsional)")).not.toBeInTheDocument();
    expect(screen.getByText(/Edit Keterangan/)).toBeInTheDocument();
  });

  it("flags unsupported and oversized files immediately and never sends them", async () => {
    uploadGalleryImageAction.mockResolvedValue(ok("good.png"));
    const { select } = setup();
    select(png("good.png"), png("notes.txt", 10, "text/plain"), png("huge.png", 6 * 1024 * 1024));

    expect(screen.getByText(/Format tidak didukung/)).toBeInTheDocument();
    expect(screen.getByText(/Ukuran melebihi 5MB/)).toBeInTheDocument();
    expect(screen.getByText("1 berkas siap diunggah, 2 tidak bisa diunggah.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah Foto" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unggah Foto" }));
    await waitFor(() => expect(uploadGalleryImageAction).toHaveBeenCalledTimes(1));
    expect((uploadGalleryImageAction.mock.calls[0][1] as FormData).get("file")).toMatchObject({
      name: "good.png",
    });
  });

  it("caps a selection at 20 and says how many were left out", () => {
    const { select } = setup();
    select(...Array.from({ length: 25 }, (_, index) => png(`p${index}.png`)));

    expect(screen.getByRole("button", { name: "Unggah 20 Foto" })).toBeInTheDocument();
    expect(screen.getByText(/5 foto terakhir tidak dimasukkan/)).toBeInTheDocument();
  });

  it("asks for a file when uploading with nothing chosen", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Unggah Foto" }));

    expect(screen.getByText("Pilih berkas gambar untuk diunggah.")).toBeInTheDocument();
    expect(uploadGalleryImageAction).not.toHaveBeenCalled();
  });
});

describe("GalleryImageUploadForm — uploading", () => {
  it("uploads one photo at a time, in the order chosen, reporting each as it lands", async () => {
    const releases: Array<() => void> = [];
    uploadGalleryImageAction.mockImplementation(
      (_eventId: string, formData: FormData) =>
        new Promise((resolve) => {
          releases.push(() => resolve(ok((formData.get("file") as File).name)));
        }),
    );
    const { select, onUploaded } = setup();
    select(png("a.png"), png("b.png"), png("c.png"));
    fireEvent.click(screen.getByRole("button", { name: "Unggah 3 Foto" }));

    // Only the first request is in flight until it finishes.
    await waitFor(() => expect(uploadGalleryImageAction).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Mengunggah 1 dari 3..." })).toBeDisabled();

    releases[0]();
    await waitFor(() => expect(uploadGalleryImageAction).toHaveBeenCalledTimes(2));
    expect(onUploaded).toHaveBeenCalledTimes(1);

    releases[1]();
    await waitFor(() => expect(uploadGalleryImageAction).toHaveBeenCalledTimes(3));
    releases[2]();

    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(3));
    expect(onUploaded.mock.calls.map((call) => (call[0] as EditorGalleryItem).id)).toEqual([
      "item-a.png",
      "item-b.png",
      "item-c.png",
    ]);
    expect(await screen.findByText("3 foto berhasil diunggah.")).toBeInTheDocument();
  });

  it("sends the caption only for a single photo", async () => {
    uploadGalleryImageAction.mockResolvedValue(ok("a.png"));
    const { select } = setup();
    select(png("a.png"));
    fireEvent.change(screen.getByLabelText("Keterangan (opsional)"), {
      target: { value: "Foto pertama" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unggah Foto" }));

    await waitFor(() => expect(uploadGalleryImageAction).toHaveBeenCalledTimes(1));
    expect((uploadGalleryImageAction.mock.calls[0][1] as FormData).get("caption")).toBe(
      "Foto pertama",
    );
  });

  it("skips a photo the server rejects and still uploads the rest", async () => {
    uploadGalleryImageAction
      .mockResolvedValueOnce(ok("a.png"))
      .mockResolvedValueOnce({
        ok: false,
        error: "Gambar rusak.",
        fieldErrors: { file: ["Gambar rusak."] },
      })
      .mockResolvedValueOnce(ok("c.png"));
    const { select, onUploaded } = setup();
    select(png("a.png"), png("b.png"), png("c.png"));
    fireEvent.click(screen.getByRole("button", { name: "Unggah 3 Foto" }));

    expect(await screen.findByText("2 foto berhasil diunggah, 1 gagal.")).toBeInTheDocument();
    expect(onUploaded).toHaveBeenCalledTimes(2);
    expect(uploadGalleryImageAction).toHaveBeenCalledTimes(3);
    const row = screen.getByText("b.png").closest("li") as HTMLElement;
    expect(within(row).getByText("Gambar rusak.")).toBeInTheDocument();
  });

  it("stops on a failure that is not about the photo and keeps the rest waiting to retry", async () => {
    uploadGalleryImageAction
      .mockResolvedValueOnce(ok("a.png"))
      .mockResolvedValueOnce({ ok: false, error: "Terlalu banyak unggahan. Coba lagi nanti." });
    const { select, onUploaded } = setup();
    select(png("a.png"), png("b.png"), png("c.png"));
    fireEvent.click(screen.getByRole("button", { name: "Unggah 3 Foto" }));

    expect(
      await screen.findByText("Terlalu banyak unggahan. Coba lagi nanti."),
    ).toBeInTheDocument();
    expect(uploadGalleryImageAction).toHaveBeenCalledTimes(2);
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 foto berhasil diunggah, 2 belum diunggah.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah 2 Foto" })).toBeEnabled();
  });

  it("clears the list on request", () => {
    const { select } = setup();
    select(png("a.png"), png("b.png"));
    fireEvent.click(screen.getByRole("button", { name: "Bersihkan Daftar" }));

    expect(screen.queryByText("a.png")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah Foto" })).toBeInTheDocument();
  });
});
