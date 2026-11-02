export default function EditorLoading() {
  return (
    <div className="border-border/60 bg-card flex min-h-[calc(100dvh-8rem)] animate-pulse flex-col rounded-3xl border shadow-sm">
      <div className="border-border/60 flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted size-9 rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-muted h-4 w-40 rounded" />
            <div className="bg-muted h-3 w-24 rounded" />
          </div>
        </div>
        <div className="bg-muted h-7 w-28 rounded-full" />
      </div>
      <div className="flex flex-1">
        <div className="hidden w-56 space-y-2 p-5 lg:block">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="bg-muted h-9 rounded-xl" />
          ))}
        </div>
        <div className="border-border/60 flex-1 space-y-4 p-6 lg:border-l lg:p-8">
          <div className="flex items-center gap-4">
            <div className="bg-muted size-11 rounded-xl" />
            <div className="bg-muted h-6 w-48 rounded" />
          </div>
          <div className="bg-muted h-40 w-full rounded-2xl" />
          <div className="bg-muted h-40 w-full rounded-2xl" />
        </div>
        <div className="border-border/60 bg-muted/30 hidden w-[380px] items-start justify-center border-l p-6 lg:flex xl:w-[420px]">
          <div className="bg-muted h-[600px] w-full max-w-[330px] rounded-[3rem]" />
        </div>
      </div>
    </div>
  );
}
