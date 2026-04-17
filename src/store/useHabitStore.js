import { create } from 'zustand';
import { db } from '../db/db';
import { habitsTable } from '../db/habits.table';
import { logsTable } from '../db/logs.table';

const DEFAULT_HABITS = [
  { name: 'Wake up at 5:00', emoji: '⏰', color: '#7c5cfc' },
  { name: 'Gym', emoji: '🏋️', color: '#10b981' },
  { name: 'Reading / Learning', emoji: '📚', color: '#f59e0b' },
  { name: 'Day Planning', emoji: '📋', color: '#3b82f6' },
  { name: 'Budget Tracking', emoji: '💰', color: '#10b981' },
  { name: 'Project Work', emoji: '💻', color: '#7c5cfc' },
  { name: 'No Alcohol', emoji: '🚫', color: '#ef4444' },
  { name: 'Social Media Detox', emoji: '🌿', color: '#10b981' },
  { name: 'Goal Journaling', emoji: '📓', color: '#f59e0b' },
  { name: 'Cold Shower', emoji: '🚿', color: '#3b82f6' },
];

const EMOJI_OPTIONS = ['⭐', '🎯', '🔥', '💪', '🧘', '✍️', '🎨', '🎵', '🏃', '🥗'];
const COLOR_OPTIONS = ['#7c5cfc', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

export const useHabitStore = create((set, get) => ({
  habits: [],
  logs: [],
  loading: true,

  loadAll: async () => {
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
