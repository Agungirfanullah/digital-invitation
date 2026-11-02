import { MemberPhoto } from "@/components/invitation/sections/member-photo";
import type { PublicIdentity, PublicIdentityMember } from "@/lib/invitations/types";
import { toInstagramProfileUrl } from "@/lib/invitations/format";
import { MemberParents } from "@/components/invitation/sections/member-parents";
import { SectionHeading } from "@/components/invitation/sections/section-heading";

function Member({ member }: { member: PublicIdentityMember }) {
  return (
    <div className="flex items-start gap-5 py-8 text-left">
      <div className="shrink-0 empty:hidden [&>div]:mx-0 [&>div]:mb-0 [&>div]:h-32 [&>div]:w-24 [&>div]:border-0 [&>div]:shadow-none">
        <MemberPhoto member={member} shape="square" />
      </div>
      <div className="min-w-0 pt-1">
        {member.role && (
          <p className="text-[11px] tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
            {member.role}
          </p>
        )}
        <p
          className="mt-1 text-3xl leading-tight text-[color:var(--ii-primary)]"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {member.name}
        </p>
        <MemberParents member={member} />
        {member.instagram && (
          <a
            href={toInstagramProfileUrl(member.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-[color:var(--ii-text)] underline underline-offset-4 opacity-70"
          >
            @{member.instagram}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Type-aware identity block (couple, celebrant, baby & family, host,
 * organization), laid out as Minimal Elegant's left-aligned list: a small
 * portrait beside each name, hairlines between members. Callers render it
 * only when `invitation.identity` exists — there is no fake identity data
 * to fall back to.
 */
export function IdentitySection({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading" className="px-8 py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading id="identity-heading">{identity.heading}</SectionHeading>
        {identity.members.length > 0 && (
          <div className="divide-y divide-[color:var(--ii-secondary)] border-y border-[color:var(--ii-secondary)]">
            {identity.members.map((member, index) => (
              <Member key={`${index}-${member.name}`} member={member} />
            ))}
          </div>
        )}
        {identity.details.length > 0 && (
          <ul className="mt-6 space-y-1 text-sm text-[color:var(--ii-text)] opacity-80">
            {identity.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
