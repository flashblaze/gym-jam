import { type WorkoutDraft, mergeDraftInto, resolveDraft, toSession } from "~/lib/workout";
import { clearDraft, loadDraft, saveDraft } from "~/lib/workout-draft-storage";

import { type Exercise, db } from "./index";

/** The workout on `date` as the workout page would load it (ticked and unticked), or `null`. */
export async function loadWorkout(
  date: string,
  exercisesById: Record<string, Exercise>,
): Promise<WorkoutDraft | null> {
  const stored = (await db.sessions.where("date").equals(date).first()) ?? null;
  const workout = resolveDraft(stored, loadDraft(date), date, exercisesById);
  return workout.blocks.length > 0 ? workout : null;
}

/**
 * Moves `workout` to `toDate`. If `target` (that day's workout) exists, the exercises are
 * appended to it instead and `workout` is deleted.
 */
export async function relocateWorkout(
  workout: WorkoutDraft,
  toDate: string,
  target: WorkoutDraft | null,
): Promise<void> {
  const result = target ? mergeDraftInto(target, workout) : { ...workout, date: toDate };
  const session = toSession(result);

  await db.transaction("rw", db.sessions, async () => {
    if (target) await db.sessions.delete(workout.sessionId);
    if (session.exercises.length > 0) await db.sessions.put(session);
    else await db.sessions.delete(session.id);
  });

  if (loadDraft(workout.date)?.sessionId === workout.sessionId) clearDraft(workout.date);
  if (result.blocks.length > 0) saveDraft(result);
}
