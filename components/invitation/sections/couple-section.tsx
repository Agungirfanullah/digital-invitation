import type { PublicWeddingProfile } from "@/lib/invitations/types";

interface ProfileData {
  fullName: string | null;
  nickname: string | null;
  instagram: string | null;
}

function Profile({ label, profile }: { label: string; profile: ProfileData }) {
  if (!profile.fullName && !profile.nickname) return null;

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-xs tracking-widest text-[color:var(--ii-accent)] uppercase">{label}</p>
      <p className="text-2xl font-medium text-[color:var(--ii-primary)]">
        {profile.fullName ?? profile.nickname}
      </p>
      {profile.instagram && (
        <p className="text-sm text-[color:var(--ii-text)] opacity-70">@{profile.instagram}</p>
      )}
    </div>
  );
}

/** Only rendered when a WeddingProfile exists — there is no fake couple data to fall back to. */
export function CoupleSection({ profile }: { profile: PublicWeddingProfile }) {
  return (
    <section aria-labelledby="couple-heading" className="px-6 py-16 text-center">
      <h2
        id="couple-heading"
        className="mb-8 text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase"
      >
        Mempelai
      </h2>
      <div className="mx-auto flex max-w-md flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
        <Profile
          label="Mempelai Wanita"
          profile={{
            fullName: profile.brideFullName,
            nickname: profile.brideNickname,
            instagram: profile.brideInstagram,
          }}
        />
        <p className="text-2xl text-[color:var(--ii-primary)]">&amp;</p>
        <Profile
          label="Mempelai Pria"
          profile={{
            fullName: profile.groomFullName,
            nickname: profile.groomNickname,
            instagram: profile.groomInstagram,
          }}
        />
      </div>
    </section>
  );
}
