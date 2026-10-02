import { remapExercise } from "~/lib/sets";
import { remapDraftExercise } from "~/lib/workout";
import { updateAllDrafts } from "~/lib/workout-draft-storage";

import { db } from "./index";

/** Moves all history of `fromId` onto `intoId` (same type), then deletes `fromId`. */
export async function mergeExercises(fromId: string, intoId: string): Promise<void> {
  if (fromId === intoId) throw new Error("Pick a different exercise to merge into.");
  await db.transaction("rw", [db.exercises, db.sessions], async () => {
    const [from, into] = await Promise.all([db.exercises.get(fromId), db.exercises.get(intoId)]);
    if (!from || !into) throw new Error("One of the exercises no longer exists.");
    if (from.type !== into.type) throw new Error("Only exercises of the same type can be merged.");

    const sessions = await db.sessions.toArray();
    const updated = sessions.flatMap((sess) => remapExercise(sess, fromId, intoId) ?? []);
    if (updated.length > 0) await db.sessions.bulkPut(updated);
    await db.exercises.delete(fromId);
  });
  updateAllDrafts((draft) => remapDraftExercise(draft, fromId, intoId));
}
