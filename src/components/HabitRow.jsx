import { memo, useMemo, useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { buildMonthDays, isWeekend, toDateString } from '../utils/date';

// ── Easter Egg 5 — Triple-click streak messages ───────────────────────────────
const STREAK_MSGS = [
  (n) => `${n} mornings you chose discipline`,
  (n) => `${n} days of showing up. Most won't.`,
  (n) => `${n} in a row. You're building something real.`,
  (n) => `${n} days of compound interest on yourself`,
  (n) => `${n} cold showers you didn't skip`,
  (n) => `${n} days your future self is grateful for`,
  (n) => `${n} sunrises. ${n} wins.`,
  (n) => `That's ${n} times discipline beat comfort`,
];

// Module-level counter so messages cycle across all habit rows
let globalMsgIdx = 0;

const CheckCell = memo(function CheckCell({ checked, weekend, today, color, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={[
        'flex items-center justify-center border-r border-bg-muted cursor-pointer transition-colors h-12',
        weekend ? 'bg-black/20' : '',
        checked ? 'bg-accent-dim' : 'hover:bg-white/5',
      ].join(' ')}
    >
      <div
        className={[
          'w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center transition-all duration-150',
          checked
            ? 'scale-110 border-transparent'
            : today
            ? 'border-accent/60 hover:border-accent'
            : 'border-text-faint hover:border-accent/50',
        ].join(' ')}
        style={checked ? { background: color, borderColor: color } : {}}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
});

function HabitRow({ habit, logs, year, month, toggleHabit, onDelete, streak, colTemplate }) {
  const days = buildMonthDays(year, month);
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;

  const completedDates = useMemo(() => {
    const s = new Set();
    for (const l of logs) {
      if (l.habitId === habit.id && l.completed) s.add(l.date);
    }
    return s;
  }, [logs, habit.id]);

  // ── Triple-click streak ──────────────────────────────────────────────────
  const [streakTip, setStreakTip] = useState('');
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const tipTimerRef   = useRef(null);

  const handleStreakClick = useCallback((e) => {
    e.stopPropagation();
    clickCountRef.current += 1;
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current >= 3 && streak >= 1) {
        const msg = STREAK_MSGS[globalMsgIdx % STREAK_MSGS.length](streak);
        globalMsgIdx++;
        setStreakTip(msg);
        clearTimeout(tipTimerRef.current);
        tipTimerRef.current = setTimeout(() => setStreakTip(''), 3000);
      }
      clickCountRef.current = 0;
    }, 400);
  }, [streak]);

  return (
    <div
      className="grid border-b border-bg-muted/60 group hover:bg-white/[0.02] transition-colors"
      style={{ gridTemplateColumns: colTemplate }}
    >
      <div className="flex items-center gap-2 px-4 border-r border-bg-border h-12 min-w-0">
        <span className="text-base flex-shrink-0">{habit.emoji}</span>
        <span className="text-[12.5px] font-medium text-text-secondary truncate flex-1 min-w-0">
          {habit.name}
        </span>

        {streak >= 3 && (
          <div className="relative flex-shrink-0">
            <span
              onClick={handleStreakClick}
              className="text-[10px] font-bold text-amber-400 cursor-pointer select-none"
              title="Triple-click me!"
            >
              🔥{streak}
            </span>
            {streakTip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-bg-card border border-amber-400/25 rounded-xl px-3 py-2 text-[11px] text-amber-300 text-center shadow-2xl z-50 animate-fade-in leading-snug">
                {streakTip}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => onDelete(habit.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-faint hover:text-red-400 ml-1"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {days.map((day) => {
        const dateStr = toDateString(new Date(year, month, day));
        const checked = completedDates.has(dateStr);
        const weekend = isWeekend(year, month, day);
        const isToday = isCurrentMonth && day === todayDate.getDate();

        return (
          <CheckCell
            key={day}
            checked={checked}
            weekend={weekend}
            today={isToday}
            color={habit.color || '#7c5cfc'}
            onToggle={() => toggleHabit(habit.id, dateStr)}
          />
        );
      })}
    </div>
  );
}

export default memo(HabitRow);