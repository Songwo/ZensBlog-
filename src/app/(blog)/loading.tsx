export default function BlogSegmentLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-8 lg:px-12 animate-pulse">
      <div className="h-7 w-56 rounded-lg bg-slate-200/70" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200/60" />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="h-36 rounded-lg bg-slate-200/70" />
            <div className="mt-3 h-5 w-4/5 rounded bg-slate-200/70" />
            <div className="mt-2 h-4 w-full rounded bg-slate-200/60" />
            <div className="mt-2 h-4 w-3/4 rounded bg-slate-200/60" />
            <div className="mt-4 h-3 w-24 rounded bg-slate-200/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
