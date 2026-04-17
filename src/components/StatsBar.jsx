import { useMemo } from 'react';

function StatCard({ label, value, suffix, accent }) {
  return (
    <div
      className="relative bg-bg-card border border-bg-border rounded-2xl px-4 py-4 overflow-hidden"
      style={{ '--accent': accent }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: accent }}
      />
      <p className="text-xs text-text-muted uppercase tracking-widest mb-1.5">{label}</p>
      <p className="font-syne text-2xl font-extrabold text-white leading-none">
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
