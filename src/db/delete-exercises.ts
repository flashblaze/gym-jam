import { stripExercises } from "~/lib/sets";

import { db } from "./index";

export async function deleteExercises(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  await db.transaction("rw", [db.exercises, db.sessions], async () => {
    await db.exercises.bulkDelete(ids);
    const sessions = await db.sessions.toArray();
    const updated = sessions.flatMap((sess) => stripExercises(sess, idSet) ?? []);
    if (updated.length > 0) await db.sessions.bulkPut(updated);
  });
}
