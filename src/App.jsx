import { useState, lazy, Suspense, useMemo, useEffect, useRef, useCallback } from 'react';
import Header          from './components/Header';
import StatsBar        from './components/StatsBar';
import SquadQuickStats from './components/SquadQuickStats';
import { useHabits }   from './hooks/useHabits';
import { useAuth }     from './hooks/useAuth';
import { useSquad }    from './hooks/useSquad';
import { getWeeklyStats, getDailyCompletion } from './domain/stats';
import { toDateString } from './utils/date';
import { db } from './db/db';

const HabitGrid       = lazy(() => import('./components/HabitGrid'));
const HabitCardMobile = lazy(() => import('./components/HabitCardMobile'));
const SquadSync       = lazy(() => import('./components/SquadSync'));

// ── Canvas particle burst (MAISHA easter egg) ─────────────────────────────────
function ParticleBurst({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const COLORS = ['#7c5cfc','#a08aff','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#fbbf24'];
    const particles = Array.from({ length: 140 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 14;
      return {
        x:     canvas.width  / 2,
        y:     canvas.height / 2,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size:  3 + Math.random() * 5,
        alpha: 1,
        rect:  Math.random() > 0.5,
      };
    });

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.3;
        p.vx *= 0.98;
        p.alpha -= 0.017;
        if (p.alpha <= 0) continue;
        alive = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        if (p.rect) {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (alive) rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
}

// ── Confetti rain (Perfect Week) ──────────────────────────────────────────────
function ConfettiRain({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const COLORS = ['#7c5cfc','#a08aff','#ec4899','#f59e0b','#10b981','#3b82f6','#fbbf24','#34d399'];
    const pieces = Array.from({ length: 160 }, () => ({
      x:     Math.random() * canvas.width,
      y:     -20 - Math.random() * 120,
      vx:    (Math.random() - 0.5) * 3,
      vy:    2.5 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w:     6 + Math.random() * 8,
      h:     4 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.18,
      alive: true,
    }));

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let anyAlive = false;
      for (const p of pieces) {
        if (!p.alive) continue;
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        if (p.y > canvas.height + 20) { p.alive = false; continue; }
        anyAlive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (anyAlive) rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
}

// ── Perfect Week toast ────────────────────────────────────────────────────────
function PerfectWeekToast({ visible }) {
  if (!visible) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
      <div className="flex items-center gap-3 bg-bg-card border border-amber-400/40 rounded-2xl px-6 py-4 shadow-2xl shadow-amber-400/10">
        <span className="text-3xl">🏆</span>
        <div>
          <p className="font-syne font-extrabold text-white text-sm">Perfect Week!</p>
          <p className="text-xs text-text-muted mt-0.5">7 days, 100% every day. You're unstoppable.</p>
        </div>
      </div>
    </div>
  );
}

// ── WeeklyBar ─────────────────────────────────────────────────────────────────
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
              style={{ width: `${w.pct}%`, background: 'linear-gradient(to right,#7c5cfc,#a08aff)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted text-sm">Loading your habits…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Perfect Week localStorage guard — show at most once per 7 days
const PW_KEY = 'pw_last_shown';
const PERFECT_WEEK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function wasPerfectWeekShownRecently() {
  const last = localStorage.getItem(PW_KEY);
  return last ? Date.now() - parseInt(last, 10) < PERFECT_WEEK_COOLDOWN_MS : false;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  const [year,        setYear]        = useState(today.getFullYear());
  const [month,       setMonth]       = useState(today.getMonth());
  const [squadOpen,   setSquadOpen]   = useState(false);
  const [initialFriend, setInitialFriend] = useState(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { session, user, authLoading } = useAuth();

  // ── Habit data ────────────────────────────────────────────────────────────
  const {
    habits, logs, loading,
    toggleHabit, addHabit, deleteHabit,
    exportData, importData, getStreak,
    getMonthStats, getTodayCount, totalCheckIns,
    restoreFromCloud,
  } = useHabits();

  // ── Squad ─────────────────────────────────────────────────────────────────
  const squad = useSquad(habits, logs, user, restoreFromCloud);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const monthPct   = useMemo(() => getMonthStats(year, month),                [habits, logs, year, month]);
  const weeks      = useMemo(() => getWeeklyStats(habits, logs, year, month), [habits, logs, year, month]);
  const todayCount = useMemo(() => getTodayCount(),                           [habits, logs]);

  // ─────────────────────────────────────────────────────────────────────────
  // Easter Egg 1 — MAISHA  (type the word anywhere, no focus required)
  // ─────────────────────────────────────────────────────────────────────────
  const [maishaActive, setMaishaActive] = useState(false);
  const keyBufRef = useRef('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      keyBufRef.current = (keyBufRef.current + e.key).slice(-6).toUpperCase();
      if (keyBufRef.current === 'MAISHA') {
        setMaishaActive(true);
        setTimeout(() => setMaishaActive(false), 5000);
        keyBufRef.current = '';
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Easter Egg 2 — 5am Club  (4:30–5:30 am on open)
  // ─────────────────────────────────────────────────────────────────────────
  const [is5amClub] = useState(() => {
    const t = today.getHours() * 60 + today.getMinutes();
    return t >= 270 && t <= 330; // 4:30–5:30
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Easter Egg 3 — Perfect Week  (last 7 days all 100%)
  // ─────────────────────────────────────────────────────────────────────────
  const [perfectWeekToast, setPerfectWeekToast] = useState(false);
  const [confettiActive,   setConfettiActive]   = useState(false);
  const perfectWeekChecked = useRef(false);

  useEffect(() => {
    if (perfectWeekChecked.current || habits.length === 0 || logs.length === 0) return;
    if (wasPerfectWeekShownRecently()) { perfectWeekChecked.current = true; return; }

    let allPerfect = true;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const pct = getDailyCompletion(habits, logs, toDateString(d));
      if (pct < 100) { allPerfect = false; break; }
    }

    if (allPerfect) {
      perfectWeekChecked.current = true;
      localStorage.setItem(PW_KEY, Date.now().toString());
      setConfettiActive(true);
      setPerfectWeekToast(true);
      setTimeout(() => setConfettiActive(false), 6000);
      setTimeout(() => setPerfectWeekToast(false), 5000);
    }
  }, [habits, logs]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleClearData = async () => {
    await db.habits.clear();
    await db.logs.clear();
    window.location.reload();
  };

  const handleOpenSquad = () => {
    setInitialFriend(null);
    setSquadOpen(true);
  };

  const handleViewFriend = (friend) => {
    setInitialFriend(friend);
    setSquadOpen(true);
  };

  if (loading || authLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary">
      {/* Easter egg overlays */}
      <ParticleBurst active={maishaActive} />
      <ConfettiRain  active={confettiActive} />
      <PerfectWeekToast visible={perfectWeekToast} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-20">
        <Header
          year={year} month={month}
          onPrev={prevMonth} onNext={nextMonth}
          onExport={exportData} onImport={importData}
          onClearData={handleClearData}
          onOpenSquad={handleOpenSquad}
          maishaActive={maishaActive}
          is5amClub={is5amClub}
        />

        <StatsBar
          monthPct={monthPct} todayCount={todayCount}
          habitCount={habits.length} totalCheckIns={totalCheckIns}
          isCurrentMonth={isCurrentMonth}
        />

        {squad.myUser && (
          <SquadQuickStats
            friends={squad.friends}
            myHabits={habits}
            myLogs={logs}
            onOpenSquad={handleOpenSquad}
            onViewFriend={handleViewFriend}
          />
        )}

        <Suspense fallback={<div className="h-64 bg-bg-card rounded-2xl animate-pulse" />}>
          <div className="hidden lg:block">
            <HabitGrid
              habits={habits} logs={logs} year={year} month={month}
              toggleHabit={toggleHabit} addHabit={addHabit}
              deleteHabit={deleteHabit} getStreak={getStreak}
            />
          </div>

          <div className="lg:hidden flex flex-col gap-3">
            {habits.map((habit) => (
              <HabitCardMobile
                key={habit.id} habit={habit} logs={logs}
                year={year} month={month}
                toggleHabit={toggleHabit} onDelete={deleteHabit}
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
                const n = prompt('Habit name?');
                if (n?.trim()) addHabit(n, '', '');
              }}
              className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-bg-border rounded-2xl text-text-muted text-sm hover:border-accent hover:text-accent transition-colors"
            >
              + Add habit
            </button>
          </div>
        </Suspense>

        <WeeklyBar weeks={weeks} />
      </div>

      {squadOpen && (
        <Suspense fallback={null}>
          <SquadSync
            myUser={squad.myUser}
            friends={squad.friends}
            loading={squad.loading}
            error={squad.error}
            setError={squad.setError}
            register={squad.register}
            generateInviteCode={squad.generateInviteCode}
            addFriendWithCode={squad.addFriendWithCode}
            removeFriend={squad.removeFriend}
            deleteAccount={squad.deleteAccount}
            refetch={squad.refetch}
            habits={habits}
            logs={logs}
            authUser={user}
            session={session}
            initialFriend={initialFriend}
            onClose={() => { setSquadOpen(false); setInitialFriend(null); }}
          />
        </Suspense>
      )}
    </div>
  );
}