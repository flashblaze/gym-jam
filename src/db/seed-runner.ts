import { db } from "./index";
import { SEED_CATEGORIES, SEED_EXERCISES, SEED_SESSIONS } from "./seed";

export async function seedIfEmpty() {
  // Run both count checks in parallel so neither blocks the other.
  // Dexie's .upgrade() only fires on existing DB upgrades, not fresh installs,
  // so categories must also be seeded here.
  const [catCount, exCount] = await Promise.all([db.categories.count(), db.exercises.count()]);

  if (catCount === 0) {
    await db.categories.bulkAdd(SEED_CATEGORIES);
  }

  if (exCount === 0) {
    await db.transaction("rw", db.exercises, db.sessions, async () => {
      await db.exercises.bulkAdd(SEED_EXERCISES);
      await db.sessions.bulkAdd(SEED_SESSIONS);
    });
  }
}
