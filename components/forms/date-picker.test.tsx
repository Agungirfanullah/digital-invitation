import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { DatePicker } from "@/components/forms/date-picker";

function setup(value = "") {
  const onChange = vi.fn();
  const view = render(
    <form>
      <DatePicker label="Tanggal" name="date" value={value} onChange={onChange} />
    </form>,
  );
  return { onChange, ...view };
}

describe("DatePicker", () => {
  it("shows the placeholder when empty and the Indonesian date when set", () => {
    const empty = setup();
    expect(screen.getByRole("button", { name: /Tanggal/ })).toHaveTextContent("Pilih tanggal");
    empty.unmount();

    setup("2026-12-12");
    expect(screen.getByRole("button", { name: /Tanggal/ })).toHaveTextContent("12 Desember 2026");
  });

  it("names the trigger by its label and current value", () => {
    setup("2026-12-12");
    expect(screen.getByRole("button", { name: "Tanggal 12 Desember 2026" })).toBeInTheDocument();
  });

  it("submits the raw YYYY-MM-DD value through a hidden input", () => {
    const { container } = setup("2026-12-12");
    const hidden = container.querySelector('input[type="hidden"][name="date"]');
    expect(hidden).toHaveValue("2026-12-12");
  });

  it("opens an Indonesian calendar on the selected month, Monday first", () => {
    setup("2026-12-12");
    fireEvent.click(screen.getByRole("button", { name: /Tanggal/ }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Desember 2026/)).toBeInTheDocument();
    const headers = Array.from(dialog.querySelectorAll("th")).map((header) => header.textContent);
    expect(headers).toEqual(["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]);
  });

  it("reports the picked day as YYYY-MM-DD and closes", () => {
    const { onChange } = setup("2026-12-12");
    fireEvent.click(screen.getByRole("button", { name: /Tanggal/ }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /15 Desember 2026/ }));

    expect(onChange).toHaveBeenCalledWith("2026-12-15");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an error message and links it to the trigger", () => {
    render(
      <DatePicker
        label="Tanggal"
        name="date"
        value=""
        onChange={() => {}}
        error="Tanggal wajib diisi."
      />,
    );

    expect(screen.getByText("Tanggal wajib diisi.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tanggal/ })).toHaveAttribute(
      "aria-describedby",
      "date-error",
    );
  });
});
