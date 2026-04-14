import { db } from "./index";
import { SEED_EXERCISES, SEED_SESSIONS } from "./seed";

export async function seedIfEmpty() {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.transaction("rw", db.exercises, db.sessions, async () => {
      await db.exercises.bulkAdd(SEED_EXERCISES);
      await db.sessions.bulkAdd(SEED_SESSIONS);
    });
  }
}
