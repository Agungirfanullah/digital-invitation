export default function RsvpLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-40 rounded" />
        <div className="bg-muted h-8 w-32 rounded" />
      </div>
      <div className="bg-muted/70 h-24 animate-pulse rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-muted/70 h-16 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
