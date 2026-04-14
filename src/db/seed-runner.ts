import { db } from "./index";
import { SEED_CATEGORIES, SEED_EXERCISES, SEED_SESSIONS } from "./seed";

export async function seedIfEmpty() {
  // Dexie's .upgrade() only runs when upgrading an existing DB, not on fresh
  // installs. Always ensure categories are present before seeding exercises.
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(SEED_CATEGORIES);
  }

  const exCount = await db.exercises.count();
  if (exCount === 0) {
    await db.transaction("rw", db.exercises, db.sessions, async () => {
      await db.exercises.bulkAdd(SEED_EXERCISES);
      await db.sessions.bulkAdd(SEED_SESSIONS);
    });
  }
}
