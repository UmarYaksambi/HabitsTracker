import { create } from 'zustand';
import { db } from '../db/db';
import { habitsTable } from '../db/habits.table';
import { logsTable } from '../db/logs.table';

const DEFAULT_HABITS = [
  { name: 'Wake up at 5AM', emoji: '🌅', color: '#7c3aed' },
  { name: 'Drink 2L Water', emoji: '💧', color: '#2563eb' },
  { name: 'LeetCode POTD', emoji: '🧠', color: '#eab308' },
  { name: 'LeetCode Practice', emoji: '💻', color: '#7c3aed' },
  { name: 'Long Run', emoji: '🏃', color: '#dc2626' },
  { name: 'Workout', emoji: '💪', color: '#ea580c' },
  { name: 'Reading / Learning', emoji: '📚', color: '#ca8a04' },
  { name: 'Journaling', emoji: '✍️', color: '#0ea5e9' },
];

// Used to detect "fresh seeded" local state vs real user data
const DEFAULT_HABIT_NAMES = new Set(DEFAULT_HABITS.map((h) => h.name));

const EMOJI_OPTIONS = ['⭐', '🎯', '🔥', '💪', '😴', '✍️', '🤲', '📚', '🏃', '🥗'];
const COLOR_OPTIONS = ['#7c5cfc', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

let initPromise = null; 

export const useHabitStore = create((set, get) => ({
  habits: [],
  logs: [],
  loading: true,

  loadAll: async () => {
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      const [habits, logs] = await Promise.all([
        habitsTable.getAll(),
        logsTable.getAll(),
      ]);

      if (habits.length === 0) {
        for (let i = 0; i < DEFAULT_HABITS.length; i++) {
          await habitsTable.add(DEFAULT_HABITS[i]);
        }
        const seeded = await habitsTable.getAll();
        set({ habits: seeded, logs, loading: false });
      } else {
        set({ habits, logs, loading: false });
      }
    })();

    await initPromise;
  },

  // ── Cloud restore ────────────────────────────────────────────────────────
  // Called after a Google sign-in resolves a squad user.
  // Safe to overwrite when local data is either empty or all-default (auto-seeded),
  // which means the user opened the app on a new device for the first time.
  restoreFromCloud: async (cloudHabits, cloudLogs) => {
    if (!cloudHabits?.length) return false;

    const existingHabits = await habitsTable.getAll();
    const localIsDefault =
      existingHabits.length === 0 ||
      existingHabits.every((h) => DEFAULT_HABIT_NAMES.has(h.name));

    // If the user has real custom data locally, do not overwrite.
    if (!localIsDefault) return false;

    try {
      await db.transaction('rw', db.habits, db.logs, async () => {
        await db.habits.clear();
        await db.logs.clear();

        // Re-insert with original IDs so habitId references in logs match.
        // Dexie / IndexedDB updates the key-generator to max(existing, inserted) + 1,
        // so subsequent addHabit() calls will not collide.
        for (const h of cloudHabits) {
          await db.habits.put({
            id: h.id,
            name: h.name,
            emoji: h.emoji ?? '',
            color: h.color ?? '#7c5cfc',
            createdAt: new Date().toISOString(),
          });
        }

        for (const l of cloudLogs ?? []) {
          await db.logs.add({
            habitId: l.habitId,
            date: l.date,
            completed: l.completed,
          });
        }
      });

      const [newHabits, newLogs] = await Promise.all([
        habitsTable.getAll(),
        logsTable.getAll(),
      ]);
      set({ habits: newHabits, logs: newLogs });
      return true;
    } catch (e) {
      console.error('[HabitStore] restoreFromCloud failed:', e);
      return false;
    }
  },

  addHabit: async (name, emoji, color) => {
    const idx = get().habits.length;
    const newHabit = await habitsTable.add({
      name: name.trim(),
      emoji: emoji || EMOJI_OPTIONS[idx % EMOJI_OPTIONS.length],
      color: color || COLOR_OPTIONS[idx % COLOR_OPTIONS.length],
    });
    set((s) => ({ habits: [...s.habits, newHabit] }));
  },

  deleteHabit: async (id) => {
    await habitsTable.remove(id);
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      logs: s.logs.filter((l) => l.habitId !== id),
    }));
  },

  toggleHabit: async (habitId, date) => {
    const result = await logsTable.toggle(habitId, date);
    const existing = get().logs.find(
      (l) => l.habitId === habitId && l.date === date
    );

    if (existing) {
      set((s) => ({
        logs: s.logs.map((l) =>
          l.habitId === habitId && l.date === date
            ? { ...l, completed: result }
            : l
        ),
      }));
    } else {
      set((s) => ({
        logs: [
          ...s.logs,
          { id: Date.now(), habitId, date, completed: result },
        ],
      }));
    }
  },

  isCompleted: (habitId, date) => {
    const log = get().logs.find(
      (l) => l.habitId === habitId && l.date === date
    );
    return log?.completed ?? false;
  },

  exportData: async () => {
    const habits = await habitsTable.getAll();
    const logs = await logsTable.getAll();
    const blob = new Blob([JSON.stringify({ habits, logs }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: async (file) => {
    const text = await file.text();
    const { habits, logs } = JSON.parse(text);
    await db.habits.clear();
    await db.logs.clear();
    await db.habits.bulkAdd(habits);
    await db.logs.bulkAdd(logs);
    const [newHabits, newLogs] = await Promise.all([
      habitsTable.getAll(),
      logsTable.getAll(),
    ]);
    set({ habits: newHabits, logs: newLogs });
  },
}));