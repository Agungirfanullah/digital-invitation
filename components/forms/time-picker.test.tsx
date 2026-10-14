import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { TimePicker } from "@/components/forms/time-picker";

function setup(props: Partial<React.ComponentProps<typeof TimePicker>> = {}) {
  const onChange = vi.fn();
  const view = render(
    <form>
      <TimePicker label="Mulai" name="startTime" value="" onChange={onChange} {...props} />
    </form>,
  );
  return { onChange, ...view };
}

function openList() {
  fireEvent.click(screen.getByRole("button", { name: /Mulai|Selesai/ }));
  return screen.getByRole("listbox");
}

describe("TimePicker", () => {
  it("shows the placeholder when empty and the value when set", () => {
    const empty = setup();
    expect(screen.getByRole("button", { name: /Mulai/ })).toHaveTextContent("Pilih jam");
    empty.unmount();

    setup({ value: "09:30" });
    expect(screen.getByRole("button", { name: "Mulai 09:30" })).toHaveTextContent("09:30");
  });

  it("submits the raw HH:mm value through a hidden input", () => {
    const { container } = setup({ value: "09:30" });
    expect(container.querySelector('input[type="hidden"][name="startTime"]')).toHaveValue("09:30");
  });

  it("lists every 15-minute slot of the day and marks the current one selected", () => {
    setup({ value: "09:30" });
    const list = openList();

    const options = within(list).getAllByRole("option");
    expect(options).toHaveLength(96);
    expect(options[0]).toHaveTextContent("00:00");
    expect(options[95]).toHaveTextContent("23:45");
    expect(within(list).getByRole("option", { name: "09:30" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(list).getByRole("option", { name: "09:45" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("reports the picked slot as HH:mm and closes", () => {
    const { onChange } = setup({ value: "09:30" });
    fireEvent.click(within(openList()).getByRole("option", { name: "10:15" }));

    expect(onChange).toHaveBeenCalledWith("10:15");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("disables every slot up to and including `min`, so an end time cannot precede its start", () => {
    const { onChange } = setup({ label: "Selesai", name: "endTime", value: "", min: "09:00" });
    const list = openList();

    expect(within(list).getByRole("option", { name: "08:45" })).toBeDisabled();
    expect(within(list).getByRole("option", { name: "09:00" })).toBeDisabled();
    expect(within(list).getByRole("option", { name: "09:15" })).toBeEnabled();

    fireEvent.click(within(list).getByRole("option", { name: "08:45" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps showing a stored value that is not on the 15-minute grid", () => {
    setup({ value: "08:07" });
    expect(screen.getByRole("button", { name: /Mulai/ })).toHaveTextContent("08:07");
    const list = openList();
    expect(within(list).queryByRole("option", { selected: true })).not.toBeInTheDocument();
  });

  it("moves focus through the available slots with the arrow keys", () => {
    setup({ value: "09:30" });
    const list = openList();
    const current = within(list).getByRole("option", { name: "09:30" });
    current.focus();

    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(within(list).getByRole("option", { name: "09:45" })).toHaveFocus();

    fireEvent.keyDown(list, { key: "ArrowUp" });
    expect(within(list).getByRole("option", { name: "09:30" })).toHaveFocus();

    fireEvent.keyDown(list, { key: "End" });
    expect(within(list).getByRole("option", { name: "23:45" })).toHaveFocus();

    fireEvent.keyDown(list, { key: "Home" });
    expect(within(list).getByRole("option", { name: "00:00" })).toHaveFocus();
  });
});
