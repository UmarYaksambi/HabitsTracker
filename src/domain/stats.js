import { buildMonthDays, getDaysInMonth, toDateString } from '../utils/date';

// ---------------------------------------------------------------------------
// Build an O(1) lookup map: "habitId|date" → completed boolean
// ---------------------------------------------------------------------------
function buildLogMap(logs) {
  const map = new Map();
  for (const l of logs) {
    map.set(`${l.habitId}|${l.date}`, l.completed);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Monthly completion — only counts days that have already passed (or today).
// Counting future days inflates the denominator and gives misleadingly low %.
// ---------------------------------------------------------------------------
export function getMonthlyCompletion(habits, logs, year, month) {
  if (habits.length === 0) return 0;

  const today         = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const maxDay = isCurrentMonth
    ? today.getDate()
    : getDaysInMonth(year, month);

  const logMap = buildLogMap(logs);
  let done = 0;
  let total = 0;

  for (const habit of habits) {
    for (let d = 1; d <= maxDay; d++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (logMap.get(`${habit.id}|${date}`)) done++;
      total++;
    }
  }

  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ---------------------------------------------------------------------------
// Daily completion percentage for a single date
// ---------------------------------------------------------------------------
export function getDailyCompletion(habits, logs, dateStr) {
  if (habits.length === 0) return 0;
  const logMap = buildLogMap(logs);
  const done = habits.filter((h) => logMap.get(`${h.id}|${dateStr}`)).length;
  return Math.round((done / habits.length) * 100);
}

// ---------------------------------------------------------------------------
// How many habits completed on a given date
// ---------------------------------------------------------------------------
export function getDailyCount(habits, logs, dateStr) {
  const logMap = buildLogMap(logs);
  return habits.filter((h) => logMap.get(`${h.id}|${dateStr}`)).length;
}

// ---------------------------------------------------------------------------
// Weekly breakdown — caps each week at today so current-week % is accurate
// ---------------------------------------------------------------------------
export function getWeeklyStats(habits, logs, year, month) {
  const today          = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow    = new Date(year, month, 1).getDay();
  const logMap      = buildLogMap(logs);
  const weeks       = [];

  for (let w = 0; w < 6; w++) {
    const start = w * 7 - firstDow + 1;
    const end   = start + 6;

    const rangeStart = Math.max(1, start);
    const rangeEnd   = Math.min(
      daysInMonth,
      isCurrentMonth ? Math.min(end, today.getDate()) : end
    );

    if (rangeStart > rangeEnd) continue;

    let done = 0;
    let total = 0;

    for (let d = rangeStart; d <= rangeEnd; d++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const habit of habits) {
        if (logMap.get(`${habit.id}|${date}`)) done++;
        total++;
      }
    }

    if (total > 0) {
      weeks.push({
        label: `Week ${w + 1}`,
        pct: Math.round((done / total) * 100),
        done,
        total,
      });
    }
  }

  return weeks;
}

// ---------------------------------------------------------------------------
// Total check-ins ever
// ---------------------------------------------------------------------------
export function getTotalCheckIns(logs) {
  return logs.filter((l) => l.completed).length;
}