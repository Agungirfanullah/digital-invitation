import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeColorField } from "@/components/editor/sections/theme-color-field";
import { ThemeFontField } from "@/components/editor/sections/theme-font-field";

describe("ThemeColorField", () => {
  function setup(value: string | null) {
    const onChange = vi.fn();
    render(
      <ThemeColorField
        label="Warna utama"
        name="primaryColor"
        value={value}
        defaultValue="#5c4a3f"
        onChange={onChange}
      />,
    );
    return onChange;
  }

  it("shows the template color as 'Bawaan tema' while nothing is chosen", () => {
    setup(null);
    expect(screen.getByTestId("primaryColor-current")).toHaveTextContent("Bawaan tema");
    expect(screen.queryByRole("button", { name: "Pakai bawaan tema" })).not.toBeInTheDocument();
  });

  it("picks a named color without any hex typing", () => {
    const onChange = setup(null);
    fireEvent.click(screen.getByRole("button", { name: "Emas" }));
    expect(onChange).toHaveBeenCalledWith("#c9a227");
  });

  it("names the chosen preset and marks it pressed", () => {
    setup("#C9A227");
    expect(screen.getByTestId("primaryColor-current")).toHaveTextContent("Emas");
    expect(screen.getByRole("button", { name: "Emas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hitam" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports a color outside the palette as the owner's own", () => {
    setup("#123456");
    expect(screen.getByTestId("primaryColor-current")).toHaveTextContent("Warna pilihan sendiri");
  });

  it("accepts any color from the browser's color picker", () => {
    const onChange = setup(null);
    fireEvent.change(screen.getByLabelText("Warna lain"), { target: { value: "#123456" } });
    expect(onChange).toHaveBeenCalledWith("#123456");
  });

  it("returns to the template color on request", () => {
    const onChange = setup("#c9a227");
    fireEvent.click(screen.getByRole("button", { name: "Pakai bawaan tema" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("ThemeFontField", () => {
  const GEORGIA = "Georgia, 'Times New Roman', serif";

  function setup(value: string | null) {
    const onChange = vi.fn();
    render(
      <ThemeFontField
        label="Font judul"
        name="headingFont"
        value={value}
        defaultValue="'Playfair Display', Georgia, serif"
        onChange={onChange}
      />,
    );
    return onChange;
  }

  it("starts on 'Bawaan tema' and lists named fonts to choose from", () => {
    setup(null);
    const select = screen.getByLabelText("Font judul") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByRole("option", { name: "Bawaan tema" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Georgia" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Brush Script" })).toBeInTheDocument();
  });

  it("reports the chosen font's stack", () => {
    const onChange = setup(null);
    fireEvent.change(screen.getByLabelText("Font judul"), { target: { value: GEORGIA } });
    expect(onChange).toHaveBeenCalledWith(GEORGIA);
  });

  it("goes back to the template font with null", () => {
    const onChange = setup(GEORGIA);
    fireEvent.change(screen.getByLabelText("Font judul"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("keeps a font typed in before this list existed selectable", () => {
    setup("'Some Old Font', serif");
    const select = screen.getByLabelText("Font judul") as HTMLSelectElement;
    expect(select.value).toBe("'Some Old Font', serif");
    expect(screen.getByRole("option", { name: "Font sebelumnya (kustom)" })).toBeInTheDocument();
  });
});
