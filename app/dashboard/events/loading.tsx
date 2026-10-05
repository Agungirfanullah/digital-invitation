export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="bg-muted h-12 w-56 rounded" />
      <div className="bg-muted h-9 rounded-md" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
