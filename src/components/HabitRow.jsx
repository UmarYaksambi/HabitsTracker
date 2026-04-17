import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { buildMonthDays, isWeekend, toDateString, DOW_LABELS, getDayOfWeek } from '../utils/date';

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

function HabitRow({ habit, year, month, isCompleted, toggleHabit, onDelete, streak }) {
  const days = buildMonthDays(year, month);
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const colTemplate = `180px repeat(${days.length}, minmax(32px, 1fr))`;

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
          <span className="text-[10px] font-bold text-amber-400 flex-shrink-0">
            🔥{streak}
          </span>
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
        const checked = isCompleted(habit.id, dateStr);
        const weekend = isWeekend(year, month, day);
        const isToday = isCurrentMonth && day === today.getDate();

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
