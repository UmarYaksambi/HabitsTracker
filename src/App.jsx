import { useState, lazy, Suspense, useMemo } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import { useHabits } from './hooks/useHabits';
import { todayString } from './utils/date';
import { getWeeklyStats } from './domain/stats';

const HabitGrid = lazy(() => import('./components/HabitGrid'));
const HabitCardMobile = lazy(() => import('./components/HabitCardMobile'));

function WeeklyBar({ weeks }) {
  if (weeks.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {weeks.map((w) => (
        <div key={w.label} className="bg-bg-card border border-bg-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">{w.label}</p>
          <p className="font-syne text-xl font-extrabold text-white">{w.pct}%</p>
          <div className="h-1 bg-bg-border rounded-full mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${w.pct}%`,
                background: 'linear-gradient(to right, #7c5cfc, #a08aff)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted text-sm">Loading your habits...</p>
      </div>
    </div>
  );
}

export default function App() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const {
    habits,
    logs,
    loading,
    isCompleted,
    toggleHabit,
    addHabit,
    deleteHabit,
    exportData,
    importData,
    getStreak,
    getMonthStats,
    getTodayCount,
    totalCheckIns,
  } = useHabits();

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const monthPct = useMemo(() => getMonthStats(year, month), [habits, logs, year, month]);
  const weeks = useMemo(() => getWeeklyStats(habits, logs, year, month), [habits, logs, year, month]);
  const todayCount = useMemo(() => getTodayCount(), [habits, logs]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-20">
        <Header
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          onExport={exportData}
          onImport={importData}
        />

        <StatsBar
          monthPct={monthPct}
          todayCount={todayCount}
          habitCount={habits.length}
          totalCheckIns={totalCheckIns}
          isCurrentMonth={isCurrentMonth}
        />

        <Suspense fallback={<div className="h-64 bg-bg-card rounded-2xl animate-pulse" />}>
          <div className="hidden lg:block">
            <HabitGrid
              habits={habits}
              logs={logs}
              year={year}
              month={month}
              isCompleted={isCompleted}
              toggleHabit={toggleHabit}
              addHabit={addHabit}
              deleteHabit={deleteHabit}
              getStreak={getStreak}
            />
          </div>

          <div className="lg:hidden flex flex-col gap-3">
            {habits.map((habit) => (
              <HabitCardMobile
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

            {habits.length === 0 && (
              <div className="text-center py-16 text-text-muted">
                <p className="text-4xl mb-4">🎯</p>
                <p className="font-syne font-bold text-lg text-white mb-1">No habits yet</p>
                <p className="text-sm">Add your first habit to get started</p>
              </div>
            )}

            <button
              onClick={() => {
                const name = prompt('Habit name?');
                if (name?.trim()) addHabit(name, '', '');
              }}
              className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-bg-border rounded-2xl text-text-muted text-sm hover:border-accent hover:text-accent transition-colors"
            >
              + Add habit
            </button>
          </div>
        </Suspense>

        <WeeklyBar weeks={weeks} />
      </div>
    </div>
  );
}
