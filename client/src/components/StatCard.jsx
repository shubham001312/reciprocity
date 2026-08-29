export default function StatCard({ value, label, color = '', icon: Icon }) {
  const colorMap = {
    teal: { text: 'text-teal', bg: 'bg-teal-bg', border: 'border-teal-border', accent: '#0891B2' },
    brass: { text: 'text-brass', bg: 'bg-brass-bg', border: 'border-brass/20', accent: '#D97706' },
    plum: { text: 'text-plum', bg: 'bg-plum-bg', border: 'border-plum-border', accent: '#9333EA' },
    present: { text: 'text-present', bg: 'bg-present-bg', border: 'border-present-border', accent: '#059669' },
  };
  const c = colorMap[color] || { text: 'text-ink', bg: 'bg-surface', border: 'border-line', accent: '#1A1B1E' };

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-surface p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group`}>
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: c.accent }}></div>
      {/* Content */}
      <div className="flex items-start justify-between">
        <div>
          <div className={`font-mono text-3xl font-bold tracking-tight ${c.text} leading-none`}>{value}</div>
          <div className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.1em] mt-2.5">{label}</div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity`}>
            <Icon size={20} className={c.text} />
          </div>
        )}
      </div>
    </div>
  );
}
