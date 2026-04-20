import { buildMonthDays, getDaysInMonth, toDateString } from '../utils/date';

export function getMonthlyCompletion(habits, logs, year, month) {
  if (habits.length === 0) return 0;
  const days = buildMonthDays(year, month);
  let done = 0;
  let total = 0;

  for (const habit of habits) {
    for (const day of days) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = logs.find((l) => l.habitId === habit.id && l.date === date);
      if (log?.completed) done++;
      total++;
    }
  }

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function getDailyCompletion(habits, logs, dateStr) {
  if (habits.length === 0) return 0;
  const done = habits.filter((h) => {
    const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
    return log?.completed;
  }).length;
  return Math.round((done / habits.length) * 100);
}

export function getDailyCount(habits, logs, dateStr) {
  return habits.filter((h) => {
    const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
    return log?.completed;
  }).length;
}

export function getWeeklyStats(habits, logs, year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const weeks = [];

  for (let w = 0; w < 6; w++) {
    const start = w * 7 - firstDow + 1;
    const end = start + 6;
    let done = 0;
    let total = 0;

    for (let d = Math.max(1, start); d <= Math.min(daysInMonth, end); d++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const habit of habits) {
        const log = logs.find((l) => l.habitId === habit.id && l.date === date);
        if (log?.completed) done++;
        total++;
      }
    }

    if (total > 0) {
      weeks.push({ label: `Week ${w + 1}`, pct: Math.round((done / total) * 100), done, total });
    }
  }

  return weeks;
}

export function getTotalCheckIns(logs) {
  return logs.filter((l) => l.completed).length;
}
