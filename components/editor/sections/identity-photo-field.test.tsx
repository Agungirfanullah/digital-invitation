import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const uploadIdentityPhotoAction = vi.fn();
const removeIdentityPhotoAction = vi.fn();

vi.mock("@/lib/editor/actions", () => ({
  uploadIdentityPhotoAction: (...args: unknown[]) => uploadIdentityPhotoAction(...args),
  removeIdentityPhotoAction: (...args: unknown[]) => removeIdentityPhotoAction(...args),
}));

import { IdentityPhotoField } from "@/components/editor/sections/identity-photo-field";

function setup(value: string | null = null) {
  const onChange = vi.fn();
  render(
    <IdentityPhotoField
      eventId="event-1"
      label="Foto buah hati"
      name="photoUrl"
      value={value}
      onChange={onChange}
    />,
  );
  const input = screen.getByLabelText(/Pilih Foto|Ganti Foto/) as HTMLInputElement;
  const choose = (file: File) => fireEvent.change(input, { target: { files: [file] } });
  return { onChange, choose };
}

const png = (name = "a.png", size = 1000, type = "image/png") =>
  new File([new Uint8Array(size)], name, { type });

beforeEach(() => {
  uploadIdentityPhotoAction.mockReset();
  removeIdentityPhotoAction.mockReset();
});

describe("IdentityPhotoField", () => {
  it("shows a placeholder and 'Pilih Foto' while there is no photo", () => {
    setup(null);
    expect(screen.getByText("Belum ada foto")).toBeInTheDocument();
    expect(screen.getByText("Pilih Foto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hapus Foto" })).not.toBeInTheDocument();
  });

  it("shows the current photo with 'Ganti Foto' and 'Hapus Foto'", () => {
    setup("https://storage.example/a.png");
    expect(screen.getByRole("img", { name: "Foto: Foto buah hati" })).toHaveAttribute(
      "src",
      "https://storage.example/a.png",
    );
    expect(screen.getByText("Ganti Foto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hapus Foto" })).toBeInTheDocument();
  });

  it("uploads on choosing a file and reports the new URL", async () => {
    uploadIdentityPhotoAction.mockResolvedValue({
      ok: true,
      data: { publicUrl: "https://storage.example/new.png" },
    });
    const { onChange, choose } = setup(null);

    choose(png());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("https://storage.example/new.png"));
    const formData = uploadIdentityPhotoAction.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toMatchObject({ name: "a.png" });
    expect(formData.get("previousUrl")).toBeNull();
  });

  it("sends the photo being replaced so the server can remove its file", async () => {
    uploadIdentityPhotoAction.mockResolvedValue({
      ok: true,
      data: { publicUrl: "https://storage.example/new.png" },
    });
    const { choose } = setup("https://storage.example/old.png");

    choose(png());

    await waitFor(() => expect(uploadIdentityPhotoAction).toHaveBeenCalledTimes(1));
    expect((uploadIdentityPhotoAction.mock.calls[0][1] as FormData).get("previousUrl")).toBe(
      "https://storage.example/old.png",
    );
  });

  it("flags an unsupported or oversized file without sending it", () => {
    const { onChange, choose } = setup(null);

    choose(png("notes.txt", 10, "text/plain"));
    expect(screen.getByRole("alert")).toHaveTextContent("Format tidak didukung");

    choose(png("huge.png", 6 * 1024 * 1024));
    expect(screen.getByRole("alert")).toHaveTextContent("Ukuran melebihi 5MB");

    expect(uploadIdentityPhotoAction).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the server's reason and keeps the current photo when the upload fails", async () => {
    uploadIdentityPhotoAction.mockResolvedValue({
      ok: false,
      error: "Gagal.",
      fieldErrors: { file: ["Gambar rusak."] },
    });
    const { onChange, choose } = setup("https://storage.example/old.png");

    choose(png());

    expect(await screen.findByRole("alert")).toHaveTextContent("Gambar rusak.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes the photo and clears the URL", async () => {
    removeIdentityPhotoAction.mockResolvedValue({ ok: true, data: null });
    const { onChange } = setup("https://storage.example/old.png");

    fireEvent.click(screen.getByRole("button", { name: "Hapus Foto" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
    expect(removeIdentityPhotoAction).toHaveBeenCalledWith(
      "event-1",
      "https://storage.example/old.png",
    );
  });

  it("keeps the photo when removing fails", async () => {
    removeIdentityPhotoAction.mockResolvedValue({ ok: false, error: "Terjadi kesalahan." });
    const { onChange } = setup("https://storage.example/old.png");

    fireEvent.click(screen.getByRole("button", { name: "Hapus Foto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Terjadi kesalahan.");
    expect(onChange).not.toHaveBeenCalled();
  });
});
