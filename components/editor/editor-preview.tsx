import type { PublicInvitation } from "@/lib/invitations/types";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";

/**
 * Renders through the exact same `InvitationRenderer` the public
 * `/invite/[slug]` route uses (see lib/editor/preview.ts for how the
 * `invitation` prop is assembled from live, possibly-unsaved editor
 * state) — there is no separate preview-only template.
 */
export function EditorPreview({ invitation }: { invitation: PublicInvitation }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="bg-muted/40 text-muted-foreground border-b px-4 py-2 text-center text-xs">
        Pratinjau langsung — perubahan yang belum tersimpan tetap tampil di sini.
      </div>
      <div className="mx-auto max-w-sm origin-top">
        <InvitationRenderer invitation={invitation} />
      </div>
    </div>
  );
}
