import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { submitRsvpAction } = vi.hoisted(() => ({ submitRsvpAction: vi.fn() }));
vi.mock("@/lib/rsvp/actions", () => ({ submitRsvpAction }));

import { DEMO_INVITATION_EVENT_ID } from "@/lib/marketing/demo-ids";
import { RsvpSection } from "@/components/rsvp/rsvp-section";

describe("RsvpSection", () => {
  it("demo invitation: shows a sample form that can be tried but never sent", () => {
    render(<RsvpSection eventId={DEMO_INVITATION_EVENT_ID} rsvp={null} />);

    expect(screen.getByText(/Contoh formulir/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Ya, saya akan hadir"));
    expect(screen.getByLabelText("Jumlah tamu yang hadir")).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: "Kirim RSVP" });
    expect(submit).toBeDisabled();
    fireEvent.submit(submit.closest("form")!);
    expect(submitRsvpAction).not.toHaveBeenCalled();
  });

  it("a real event without a personal link: no form, only the explanation", () => {
    render(<RsvpSection eventId="cmrealevent0000000000000" rsvp={null} />);

    expect(
      screen.getByText("RSVP hanya dapat diisi melalui tautan undangan pribadi Anda."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kirim RSVP" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Contoh formulir/)).not.toBeInTheDocument();
  });
});
