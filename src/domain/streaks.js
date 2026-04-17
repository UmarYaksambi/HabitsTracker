import { toDateString } from '../utils/date';

export function calculateStreak(habitId, logs) {
  const completed = new Set(
    logs
      .filter((l) => l.habitId === habitId && l.completed)
      .map((l) => l.date)
  );

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = toDateString(cursor);
    if (completed.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateLongestStreak(habitId, logs) {
  const completed = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort();

  if (completed.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completed.length; i++) {
    const prev = new Date(completed[i - 1]);
    const curr = new Date(completed[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}
