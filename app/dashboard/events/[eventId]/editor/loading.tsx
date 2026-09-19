export default function EditorLoading() {
  return (
    <div className="flex min-h-full animate-pulse flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="bg-muted h-8 w-40 rounded-md" />
        <div className="bg-muted h-4 w-24 rounded" />
      </div>
      <div className="flex flex-1">
        <div className="bg-muted/40 hidden w-48 lg:block" />
        <div className="flex-1 space-y-4 p-6">
          <div className="bg-muted h-6 w-48 rounded" />
          <div className="bg-muted h-10 w-full rounded-md" />
          <div className="bg-muted h-10 w-full rounded-md" />
        </div>
        <div className="bg-muted/40 hidden w-96 lg:block" />
      </div>
    </div>
  );
}
