export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString() {
  return toDateString(new Date());
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export function formatMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getDayOfWeek(year, month, day) {
  return new Date(year, month, day).getDay();
}

export function isWeekend(year, month, day) {
  const dow = getDayOfWeek(year, month, day);
  return dow === 0 || dow === 6;
}

export const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function buildMonthDays(year, month) {
  const count = getDaysInMonth(year, month);
  return Array.from({ length: count }, (_, i) => i + 1);
}
