function StatCard({ label, value, suffix, accent, icon }) {
  return (
    <div
      className="relative bg-bg-card border border-bg-border rounded-2xl px-4 py-4 overflow-hidden group hover:border-opacity-60 transition-all duration-200"
      style={{ '--accent': accent, borderColor: `${accent}25` }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
        style={{ background: `linear-gradient(to right, ${accent}, ${accent}44)` }}
      />
      {/* Subtle glow in corner */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 blur-xl"
        style={{ background: accent }}
      />

      <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 relative z-10">
        {label}
      </p>
      <p className="font-syne text-2xl font-extrabold text-white leading-none relative z-10">
        {value}
        {suffix && (
          <span className="text-sm font-medium text-text-muted ml-1">{suffix}</span>
        )}
      </p>
    </div>
  );
}

export default function StatsBar({ monthPct, todayCount, habitCount, totalCheckIns, isCurrentMonth }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <StatCard label="Monthly Progress" value={`${monthPct}%`} accent="#7c5cfc" />
      <StatCard
        label="Completed Today"
        value={isCurrentMonth ? todayCount : '—'}
        suffix={isCurrentMonth ? `/${habitCount}` : undefined}
        accent="#10b981"
      />
      <StatCard label="Total Check-ins" value={totalCheckIns} accent="#f59e0b" />
      <StatCard label="Active Habits" value={habitCount} accent="#ec4899" />
    </div>
  );
}