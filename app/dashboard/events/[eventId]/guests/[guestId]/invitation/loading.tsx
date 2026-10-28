export default function GuestInvitationLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-32 rounded" />
        <div className="bg-muted h-8 w-48 rounded" />
      </div>
      <div className="bg-muted/70 h-14 animate-pulse rounded-2xl" />
      <div className="bg-muted/70 h-24 animate-pulse rounded-2xl" />
      <div className="bg-muted/70 h-32 animate-pulse rounded-2xl" />
    </div>
  );
}
