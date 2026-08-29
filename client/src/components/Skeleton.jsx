export function SkeletonLine({ className = '' }) {
  return <div className={`h-4 bg-paper-dim rounded-lg animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-card animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-paper-dim" />
        <div className="flex-1">
          <div className="h-4 bg-paper-dim rounded-lg w-1/3 mb-2" />
          <div className="h-3 bg-paper-dim rounded-lg w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-paper-dim rounded-lg w-full" />
        <div className="h-3 bg-paper-dim rounded-lg w-3/4" />
        <div className="h-3 bg-paper-dim rounded-lg w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden animate-pulse">
      <div className="px-4 py-3 bg-paper-dim/50 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-paper-dim rounded-lg flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-b border-line/50">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-paper-dim rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="bg-gradient-to-br from-ink to-ink/90 rounded-2xl p-8 mb-8 animate-pulse">
      <div className="h-4 bg-paper/10 rounded-lg w-32 mb-4" />
      <div className="h-8 bg-paper/10 rounded-lg w-64 mb-3" />
      <div className="h-4 bg-paper/10 rounded-lg w-96 mb-6" />
      <div className="flex gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <div className="h-8 bg-paper/10 rounded-lg w-16 mb-1" />
            <div className="h-3 bg-paper/10 rounded-lg w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
