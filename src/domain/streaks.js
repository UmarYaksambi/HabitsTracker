import { toDateString } from '../utils/date';

// ---------------------------------------------------------------------------
// Current streak
// Grace-period: if today is not yet completed we start counting from yesterday
// so a 30-day streak isn't shown as 0 just because it's 9am.
// ---------------------------------------------------------------------------
export function calculateStreak(habitId, logs) {
  const completed = new Set(
    logs.filter((l) => l.habitId === habitId && l.completed).map((l) => l.date)
  );

  const cursor = new Date();
  if (!completed.has(toDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completed.has(toDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Longest ever streak (handles duplicate date entries gracefully)
// ---------------------------------------------------------------------------
export function calculateLongestStreak(habitId, logs) {
  const dates = [
    ...new Set(
      logs
        .filter((l) => l.habitId === habitId && l.completed)
        .map((l) => l.date)
    ),
  ].sort();

  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const diff =
      (new Date(dates[i]) - new Date(dates[i - 1])) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

// ---------------------------------------------------------------------------
// Mutual 🤝 streak — consecutive days where BOTH parties hit 100 %
// Grace-period logic mirrors calculateStreak.
// ---------------------------------------------------------------------------
export function calculateMutualStreak(myHabits, myLogs, friendHabits, friendLogs) {
  if (!myHabits.length || !friendHabits.length) return 0;

  const myFull     = buildFullCompletionSet(myHabits, myLogs);
  const friendFull = buildFullCompletionSet(friendHabits, friendLogs);

  const cursor = new Date();
  const todayKey = toDateString(cursor);
  if (!myFull.has(todayKey) || !friendFull.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = toDateString(cursor);
    if (myFull.has(key) && friendFull.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Internal: build a Set of dates where every habit was completed
// ---------------------------------------------------------------------------
function buildFullCompletionSet(habits, logs) {
  const habitIds = new Set(habits.map((h) => h.id));
  const byDate   = new Map();

  for (const log of logs) {
    if (!log.completed || !habitIds.has(log.habitId)) continue;
    if (!byDate.has(log.date)) byDate.set(log.date, new Set());
    byDate.get(log.date).add(log.habitId);
  }

  const result = new Set();
  for (const [date, done] of byDate) {
    if (habitIds.size > 0 && done.size >= habitIds.size) result.add(date);
  }
  return result;
}