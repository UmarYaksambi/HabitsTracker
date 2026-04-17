import { db } from './db';

export const habitsTable = {
  async getAll() {
    return db.habits.orderBy('createdAt').toArray();
  },

  async add(habit) {
    const id = await db.habits.add({
      ...habit,
      createdAt: new Date().toISOString(),
    });
    return db.habits.get(id);
  },

  async update(id, changes) {
    await db.habits.update(id, changes);
    return db.habits.get(id);
  },

  async remove(id) {
    await db.transaction('rw', db.habits, db.logs, async () => {
      await db.habits.delete(id);
      await db.logs.where('habitId').equals(id).delete();
    });
  },
};
