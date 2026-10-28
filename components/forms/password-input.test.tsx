import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FormField } from "@/components/forms/form-field";

describe("password fields", () => {
  it("hide the value by default and reveal it on request, keeping what was typed", () => {
    render(<FormField label="Kata sandi" name="password" type="password" />);
    const input = screen.getByLabelText("Kata sandi", { exact: true }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Rahasia-123" } });

    expect(input.type).toBe("password");
    const toggle = screen.getByRole("button", { name: "Tampilkan kata sandi" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(input.value).toBe("Rahasia-123");
    expect(screen.getByRole("button", { name: "Sembunyikan kata sandi" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan kata sandi" }));
    expect(input.type).toBe("password");
  });

  it("never submit the form when toggled", () => {
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <FormField label="Kata sandi" name="password" type="password" />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan kata sandi" }));
    expect(submitted).toBe(false);
  });

  it("leave other field types as plain inputs", () => {
    render(<FormField label="Email" name="email" type="email" />);
    expect((screen.getByLabelText("Email") as HTMLInputElement).type).toBe("email");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
