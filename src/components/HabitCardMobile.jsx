import { useState, memo, useMemo } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { buildMonthDays, isWeekend, toDateString } from '../utils/date';

function MiniCalendar({ habit, logs, year, month, toggleHabit }) {
  const days = buildMonthDays(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const blanks = Array.from({ length: firstDow });

  const completedDates = useMemo(() => {
    const s = new Set();
    for (const l of logs) {
      if (l.habitId === habit.id && l.completed) s.add(l.date);
    }
    return s;
  }, [logs, habit.id]);

  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[9px] text-text-faint uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = toDateString(new Date(year, month, day));
          const checked = completedDates.has(dateStr);
          const weekend = isWeekend(year, month, day);
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <button
              key={day}
              onClick={() => toggleHabit(habit.id, dateStr)}
              className={[
                'aspect-square rounded flex items-center justify-center text-[10px] font-medium transition-all',
                checked
                  ? 'text-white scale-105'
                  : isToday
                  ? 'border border-accent/50 text-accent'
                  : weekend
                  ? 'text-text-faint'
                  : 'text-text-muted hover:bg-bg-border',
              ].join(' ')}
              style={checked ? { background: habit.color || '#7c5cfc' } : {}}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Accepts `logs` directly instead of `isCompleted` so React.memo
// detects prop changes (new array ref) whenever the store updates.
function HabitCardMobile({ habit, logs, year, month, toggleHabit, onDelete, streak }) {
  const [expanded, setExpanded] = useState(false);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayStr = toDateString(today);

  const completedDates = useMemo(() => {
    const s = new Set();
    for (const l of logs) {
      if (l.habitId === habit.id && l.completed) s.add(l.date);
    }
    return s;
  }, [logs, habit.id]);

  const todayDone = isCurrentMonth && completedDates.has(todayStr);

  const days = buildMonthDays(year, month);
  const completedCount = days.filter((d) =>
    completedDates.has(toDateString(new Date(year, month, d)))
  ).length;
  const pct = days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0;

  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 p-4">
        <span className="text-2xl">{habit.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{habit.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: habit.color || '#7c5cfc' }}
              />
            </div>
            <span className="text-[10px] text-text-muted shrink-0">{pct}%</span>
            {streak >= 3 && (
              <span className="text-[10px] font-bold text-amber-400">🔥{streak}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isCurrentMonth && (
            <button
              onClick={() => toggleHabit(habit.id, todayStr)}
              className={[
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 text-sm',
                todayDone ? 'scale-110' : 'bg-bg-muted border border-bg-border',
              ].join(' ')}
              style={todayDone ? { background: habit.color || '#7c5cfc' } : {}}
              title="Toggle today"
            >
              {todayDone ? '✓' : '+'}
            </button>
          )}

          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-text-faint hover:text-text-muted transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            onClick={() => onDelete(habit.id)}
            className="text-text-faint hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-bg-border/60 pt-3 animate-fade-in">
          <MiniCalendar
            habit={habit}
            logs={logs}
            year={year}
            month={month}
            toggleHabit={toggleHabit}
          />
        </div>
      )}
    </div>
  );
}

export default memo(HabitCardMobile);