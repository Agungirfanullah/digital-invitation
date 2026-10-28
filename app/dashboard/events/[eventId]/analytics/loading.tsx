export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-40 rounded" />
        <div className="bg-muted h-8 w-32 rounded" />
      </div>
      <div className="bg-muted/70 h-28 animate-pulse rounded-2xl" />
      <div className="bg-muted/70 h-36 animate-pulse rounded-2xl" />
      <div className="bg-muted/70 h-28 animate-pulse rounded-2xl" />
    </div>
  );
}
