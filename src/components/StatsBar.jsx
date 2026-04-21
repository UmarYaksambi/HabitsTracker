import { useState, useEffect, useRef } from 'react';

// Milestones that trigger the ghost animation on Total Check-ins
const MILESTONES = [100, 365, 500, 1000];

const MILESTONE_ICONS = {
  100:  '👻',  // the little ghost — unexpected, memorable
  365:  '🌟',
  500:  '👑',
  1000: '🏆',
};

const MILESTONE_LABELS = {
  100:  '100 check-ins!',
  365:  'A full year of moments',
  500:  '500 wins',
  1000: 'Four digits. Legendary.',
};

function StatCard({ label, value, suffix, accent, icon, milestone }) {
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
      {/* Subtle glow */}
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

      {/* Milestone ghost overlay */}
      {milestone && (
        <>
          <style>{`
            @keyframes milestoneFloat {
              0%   { transform: translate(-50%, 0)   scale(1);   opacity: 1; }
              50%  { transform: translate(-50%, -18px) scale(1.25); opacity: 0.9; }
              100% { transform: translate(-50%, -36px) scale(0.7); opacity: 0; }
            }
            .milestone-float {
              animation: milestoneFloat 2.2s ease-out forwards;
            }
          `}</style>
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
            <span className="milestone-float text-3xl" style={{ position: 'relative', left: '50%' }}>
              {MILESTONE_ICONS[milestone]}
            </span>
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-20 animate-fade-in">
            <span className="text-[9px] font-syne font-bold uppercase tracking-widest"
              style={{ color: accent }}>
              {MILESTONE_LABELS[milestone]}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function StatsBar({ monthPct, todayCount, habitCount, totalCheckIns, isCurrentMonth }) {
  const prevRef = useRef(null);
  const [activeMilestone, setActiveMilestone] = useState(null);

  useEffect(() => {
    if (prevRef.current !== null) {
      for (const m of MILESTONES) {
        if (prevRef.current < m && totalCheckIns >= m) {
          setActiveMilestone(m);
          const t = setTimeout(() => setActiveMilestone(null), 3500);
          return () => clearTimeout(t);
        }
      }
    }
    prevRef.current = totalCheckIns;
  }, [totalCheckIns]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <StatCard label="Monthly Progress" value={`${monthPct}%`} accent="#7c5cfc" />
      <StatCard
        label="Completed Today"
        value={isCurrentMonth ? todayCount : '—'}
        suffix={isCurrentMonth ? `/${habitCount}` : undefined}
        accent="#10b981"
      />
      <StatCard
        label="Total Check-ins"
        value={totalCheckIns}
        accent="#f59e0b"
        milestone={activeMilestone}
      />
      <StatCard label="Active Habits" value={habitCount} accent="#ec4899" />
    </div>
  );
}