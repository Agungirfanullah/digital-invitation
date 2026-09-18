export default function EventDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-56 rounded" />
          <div className="bg-muted h-4 w-40 rounded" />
        </div>
        <div className="bg-muted h-9 w-24 rounded-md" />
      </div>
      <div className="bg-muted h-28 rounded-lg" />
      <div className="bg-muted h-20 rounded-lg" />
    </div>
  );
}
