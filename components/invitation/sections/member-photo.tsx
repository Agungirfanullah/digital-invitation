import type { PublicIdentityMember } from "@/lib/invitations/types";

export type MemberPhotoShape = "round" | "arch" | "square" | "rounded";

const FRAME: Record<MemberPhotoShape, string> = {
  round: "size-32 rounded-full",
  arch: "h-40 w-32 rounded-t-full rounded-b-md",
  square: "size-32 rounded-none",
  rounded: "size-32 rounded-2xl",
};

/**
 * The photo of one identity member (a bride or groom, the celebrant, the
 * baby, the host, or an organization's logo), framed in the template's own
 * shape. Renders nothing when the member has no photo, so an invitation
 * without photos is unchanged. Colored from the theme variables only.
 */
export function MemberPhoto({
  member,
  shape = "round",
}: {
  member: PublicIdentityMember;
  shape?: MemberPhotoShape;
}) {
  if (!member.photoUrl) return null;

  return (
    <div
      className={`mx-auto mb-4 overflow-hidden border-2 border-[color:var(--ii-accent)] bg-[color:var(--ii-secondary)] shadow-sm ${FRAME[shape]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- our own uploaded storage object. */}
      <img
        src={member.photoUrl}
        alt={`Foto ${member.name}`}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </div>
  );
}
