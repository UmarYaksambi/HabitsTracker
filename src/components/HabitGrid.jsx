import { useState } from 'react';
import { Plus } from 'lucide-react';
import HabitRow from './HabitRow';
import { buildMonthDays, isWeekend, toDateString, DOW_LABELS } from '../utils/date';
import { getDailyCount } from '../domain/stats';

const EMOJI_OPTIONS = ['⭐', '🎯', '🔥', '💪', '🧘', '✍️', '🎨', '🎵', '🏃', '🥗'];

const COLOR_OPTIONS = [
  { label: 'Violet', value: '#7c5cfc' },
  { label: 'Green', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Pink', value: '#ec4899' },
];

function DayHeaders({ days, year, month }) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <>
      {days.map((day) => {
        const dow = new Date(year, month, day).getDay();
        const isToday = isCurrentMonth && day === today.getDate();
        const weekend = isWeekend(year, month, day);

        return (
          <div
            key={day}
            className={[
              'flex flex-col items-center justify-center py-2 px-1 border-r border-bg-muted/60 min-w-0',
              weekend ? 'bg-black/20' : '',
              isToday ? 'bg-accent-dim' : '',
            ].join(' ')}
          >
            <span className={`text-[8px] uppercase tracking-wide ${isToday ? 'text-accent-light' : 'text-text-faint'}`}>
              {DOW_LABELS[dow]}
            </span>
            <span className={`font-syne text-[11px] font-bold mt-0.5 ${isToday ? 'text-accent' : 'text-text-muted'}`}>
              {day}
            </span>
          </div>
        );
      })}
    </>
  );
}

function ProgressRow({ days, habits, logs, year, month }) {
  return (
    <>
      {days.map((day) => {
        const dateStr = toDateString(new Date(year, month, day));
        const count = getDailyCount(habits, logs, dateStr);
        const pct = habits.length > 0 ? count / habits.length : 0;
        const weekend = isWeekend(year, month, day);

        return (
          <div
            key={day}
            className={[
              'flex flex-col items-center justify-center gap-1 border-r border-bg-muted/60 h-12',
              weekend ? 'bg-black/20' : '',
            ].join(' ')}
          >
            <div className="w-[18px] h-7 bg-bg-border rounded overflow-hidden flex flex-col justify-end">
              <div
                className="w-full rounded transition-all duration-500"
                style={{
                  height: `${pct * 100}%`,
                  background: 'linear-gradient(to top, #7c5cfc, #a08aff)',
                }}
              />
            </div>
            <span className="text-[8px] text-text-faint font-syne font-bold">
              {Math.round(pct * 100)}
            </span>
          </div>
        );
      })}
    </>
  );
}

function AddHabitRow({ onAdd }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState('#7c5cfc');
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name, emoji, color);
    setName('');
    setEmoji('');
    setColor('#7c5cfc');
    setOpen(false);
  };

  return (
    <div className="px-4 py-3 border-t border-bg-border bg-bg-muted/40">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors"
        >
          <Plus size={14} />
          Add new habit
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap animate-slide-up">
          <input
            autoFocus
            type="text"
            placeholder="Habit name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="flex-1 min-w-[160px] bg-bg-card border border-bg-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-faint outline-none focus:border-accent transition-colors"
          />

          <input
            type="text"
            placeholder="🙂"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-10 text-center bg-bg-card border border-bg-border rounded px-1 py-1 text-sm"
          />

          <div className="flex items-center">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`text-base w-7 h-7 rounded flex items-center justify-center transition-colors ${
                    emoji === em ? 'bg-accent/20' : 'hover:bg-bg-border'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="mx-3 w-px h-5 bg-bg-border" />

            <div className="flex gap-2 ml-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-white/30' : ''
                  }`}
                  style={{ background: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!name.trim()}
            className={`px-3 py-1.5 rounded-lg text-xs font-syne font-bold transition-colors ${
              name.trim()
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-bg-border text-text-faint cursor-not-allowed'
            }`}
          >
            Add
          </button>

          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-text-muted text-xs hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function HabitGrid({
  habits,
  logs,
  year,
  month,
  isCompleted,
  toggleHabit,
  addHabit,
  deleteHabit,
  getStreak,
}) {
  const days = buildMonthDays(year, month);
  const colTemplate = `180px repeat(${days.length}, minmax(32px, 1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className="bg-bg-muted border border-bg-border rounded-2xl overflow-hidden min-w-[700px]">
        <div
          className="grid bg-bg-card border-b border-bg-border"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div className="flex items-center px-4 py-3 border-r border-bg-border">
            <span className="text-[10px] uppercase tracking-widest text-text-muted">
              Habit
            </span>
          </div>
          <DayHeaders days={days} year={year} month={month} />
        </div>

        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            year={year}
            month={month}
            isCompleted={isCompleted}
            toggleHabit={toggleHabit}
            onDelete={deleteHabit}
            streak={getStreak(habit.id)}
          />
        ))}

        <div
          className="grid bg-bg-card border-t-2 border-bg-border"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div className="flex items-center px-4 border-r border-bg-border h-12">
            <span className="text-[10px] uppercase tracking-widest text-text-muted">
              Daily %
            </span>
          </div>
          <ProgressRow
            days={days}
            habits={habits}
            logs={logs}
            year={year}
            month={month}
          />
        </div>

        <AddHabitRow onAdd={addHabit} />
      </div>
    </div>
  );
}