import { db } from './db';

export const logsTable = {
  async getAll() {
    return db.logs.toArray();
  },

  async getByHabitAndDate(habitId, date) {
    return db.logs.where('[habitId+date]').equals([habitId, date]).first();
  },

  async getByMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return db.logs
      .filter((log) => log.date.startsWith(prefix))
      .toArray();
  },

  async toggle(habitId, date) {
    const existing = await logsTable.getByHabitAndDate(habitId, date);
    if (existing) {
      const updated = !existing.completed;
      await db.logs.update(existing.id, { completed: updated });
      return updated;
    } else {
      await db.logs.add({ habitId, date, completed: true });
      return true;
    }
  },

  async importAll(records) {
    await db.logs.clear();
    await db.logs.bulkAdd(records);
  },
};
