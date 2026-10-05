import type { PublicIdentity, PublicIdentityMember } from "@/lib/invitations/types";
import { toInstagramProfileUrl } from "@/lib/invitations/format";

function Member({ member }: { member: PublicIdentityMember }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {member.role && (
        <p className="text-xs tracking-widest text-[color:var(--ii-accent)] uppercase">
          {member.role}
        </p>
      )}
      <p className="text-2xl font-medium text-[color:var(--ii-primary)]">{member.name}</p>
      {member.instagram && (
        <a
          href={toInstagramProfileUrl(member.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[color:var(--ii-text)] underline-offset-2 opacity-70 hover:underline"
        >
          @{member.instagram}
        </a>
      )}
    </div>
  );
}

/**
 * Type-aware identity block (couple, celebrant, baby & family, host,
 * organization). Callers render it only when `invitation.identity` exists —
 * there is no fake identity data to fall back to.
 */
export function IdentitySection({ identity }: { identity: PublicIdentity }) {
  const [first, ...rest] = identity.members;

  return (
    <section aria-labelledby="identity-heading" className="px-6 py-16 text-center">
      <h2
        id="identity-heading"
        className="mb-8 text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase"
      >
        {identity.heading}
      </h2>
      {first && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
          <Member member={first} />
          {rest.map((member, index) => (
            <div key={`${index}-${member.name}`} className="contents">
              {identity.pairMembers && (
                <p aria-hidden="true" className="text-2xl text-[color:var(--ii-primary)]">
                  &amp;
                </p>
              )}
              <Member member={member} />
            </div>
          ))}
        </div>
      )}
      {identity.details.length > 0 && (
        <ul className="mx-auto mt-6 max-w-sm space-y-1 text-sm text-[color:var(--ii-text)] opacity-80">
          {identity.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
