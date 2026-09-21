export default function CheckInLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-40 rounded" />
        <div className="bg-muted h-8 w-48 rounded" />
      </div>
      <div className="bg-muted h-24 rounded-lg border" />
      <div className="bg-muted h-64 rounded-lg border" />
    </div>
  );
}
