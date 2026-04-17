import { useEffect } from 'react';
import { useHabitStore } from '../store/useHabitStore';
import { calculateStreak } from '../domain/streaks';
import {
  getMonthlyCompletion,
  getDailyCount,
  getDailyCompletion,
  getWeeklyStats,
  getTotalCheckIns,
} from '../domain/stats';
import { todayString } from '../utils/date';

export function useHabits() {
  const store = useHabitStore();

  useEffect(() => {
    store.loadAll();
  }, []);

  const today = todayString();

  const getStreak = (habitId) => calculateStreak(habitId, store.logs);

  const getMonthStats = (year, month) =>
    getMonthlyCompletion(store.habits, store.logs, year, month);

  const getTodayCount = () => getDailyCount(store.habits, store.logs, today);

  const getTodayPct = () => getDailyCompletion(store.habits, store.logs, today);

  const getWeekly = (year, month) =>
    getWeeklyStats(store.habits, store.logs, year, month);

  const totalCheckIns = getTotalCheckIns(store.logs);

  return {
    habits: store.habits,
    logs: store.logs,
    loading: store.loading,
    isCompleted: store.isCompleted,
    toggleHabit: store.toggleHabit,
    addHabit: store.addHabit,
    deleteHabit: store.deleteHabit,
    exportData: store.exportData,
    importData: store.importData,
    getStreak,
    getMonthStats,
    getTodayCount,
    getTodayPct,
    getWeekly,
    totalCheckIns,
  };
}
