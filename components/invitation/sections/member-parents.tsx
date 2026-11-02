import type { PublicIdentityMember } from "@/lib/invitations/types";

/**
 * "Putri dari / Bapak … & Ibu …" under a couple member's name (D-100).
 * Inherits the template's text alignment and font; renders nothing when no
 * parent names were entered.
 */
export function MemberParents({ member }: { member: PublicIdentityMember }) {
  if (!member.parents) return null;

  return (
    <p className="mt-2 text-sm leading-relaxed text-[color:var(--ii-text)]">
      <span className="block text-xs tracking-wide opacity-60">{member.parents.relation}</span>
      <span className="block opacity-85">{member.parents.names}</span>
    </p>
  );
}
