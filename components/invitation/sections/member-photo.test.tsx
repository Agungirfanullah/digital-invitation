import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MemberPhoto } from "@/components/invitation/sections/member-photo";
import type { PublicIdentityMember } from "@/lib/invitations/types";

const member = (photoUrl: string | null): PublicIdentityMember => ({
  role: null,
  name: "Citra Anindya",
  instagram: null,
  photoUrl,
});

describe("MemberPhoto", () => {
  it("renders nothing without a photo", () => {
    const { container } = render(<MemberPhoto member={member(null)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the photo with the person's name as its description", () => {
    render(<MemberPhoto member={member("https://storage.example/a.jpg")} />);
    expect(screen.getByRole("img", { name: "Foto Citra Anindya" })).toHaveAttribute(
      "src",
      "https://storage.example/a.jpg",
    );
  });

  it("uses a different frame per shape", () => {
    const { container, rerender } = render(
      <MemberPhoto member={member("https://storage.example/a.jpg")} shape="round" />,
    );
    expect(container.firstElementChild?.className).toContain("rounded-full");

    rerender(<MemberPhoto member={member("https://storage.example/a.jpg")} shape="arch" />);
    expect(container.firstElementChild?.className).toContain("rounded-t-full");

    rerender(<MemberPhoto member={member("https://storage.example/a.jpg")} shape="square" />);
    expect(container.firstElementChild?.className).toContain("rounded-none");
  });
});
