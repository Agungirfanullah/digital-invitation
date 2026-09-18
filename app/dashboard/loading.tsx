export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-40 rounded" />
          <div className="bg-muted h-4 w-56 rounded" />
        </div>
        <div className="bg-muted h-9 w-28 rounded-md" />
      </div>

      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
