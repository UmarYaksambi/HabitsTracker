import Dexie from 'dexie';

export const db = new Dexie('HabitTrackerDB');

db.version(1).stores({
  habits: '++id, createdAt',
  logs: '++id, habitId, date, [habitId+date]',
});
