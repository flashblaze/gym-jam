import type { Exercise, Segment, Session, SessionExercise, WorkoutSet } from "~/db/index";

import { formatDuration } from "./calc";

type ExerciseType = Exercise["type"];
type ExercisesById = Record<string, Exercise>;

export function needsWeight(type: ExerciseType | undefined): boolean {
  return type === "weighted" || type === "assisted";
}

// Unknown exercises (deleted after the set was logged) only need reps, so their orphaned
// segments never block saving the rest of a session.
export function isSegmentComplete(seg: Segment, type: ExerciseType | undefined): boolean {
  if (type === "timed") return (seg.r ?? 0) > 0;
  if (needsWeight(type) && seg.w == null) return false;
  return seg.r != null && seg.r > 0;
}

export function isSetComplete(set: WorkoutSet, exercises: ExercisesById): boolean {
  return set.every((seg) => isSegmentComplete(seg, exercises[seg.exId]?.type));
}

export function emptySegment(
  exId: string,
  type: ExerciseType | undefined,
  w: number | null = null,
): Segment {
  return { exId, w, r: type === "timed" ? 0 : null };
}

/** New single-segment set that carries over the primary weight of the previous set. */
export function appendSet(sets: WorkoutSet[], exId: string, type: ExerciseType | undefined) {
  const prevW = sets[sets.length - 1]?.[0]?.w ?? null;
  return [...sets, [emptySegment(exId, type, prevW)]];
}

export function appendDrop(set: WorkoutSet, type: ExerciseType | undefined): WorkoutSet {
  const primary = set[0];
  return [...set, emptySegment(primary.exId, type, primary.w)];
}

export function appendSuperset(
  set: WorkoutSet,
  partnerExId: string,
  partnerType: ExerciseType | undefined,
): WorkoutSet {
  return [...set, emptySegment(partnerExId, partnerType)];
}

export function replaceAt<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, i) => (i === index ? value : item));
}

export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

export function insertAt<T>(items: T[], index: number, value: T): T[] {
  return [...items.slice(0, index), value, ...items.slice(index)];
}

export const DELETED_EXERCISE_LABEL = "Deleted exercise";

export function shortExerciseName(exercise: Exercise | undefined): string {
  if (!exercise) return DELETED_EXERCISE_LABEL;
  return exercise.name.split(" ").slice(0, 2).join(" ");
}

export function formatSegmentValue(seg: Segment, type: ExerciseType | undefined): string {
  if (type === "timed") return formatDuration(seg.r ?? 0);
  const reps = seg.r == null ? "—" : String(seg.r);
  return (seg.w != null ? seg.w + "×" : "×") + reps;
}

/** e.g. "80×8 → 60×6 + Lateral Raise 10×12" (drops use →, superset partners use +). */
export function formatSet(set: WorkoutSet, primaryExId: string, exercises: ExercisesById): string {
  return set
    .map((seg, i) => {
      const segEx = exercises[seg.exId];
      const value = formatSegmentValue(seg, segEx?.type);
      if (i === 0) return value;
      if (seg.exId === primaryExId) return " → " + value;
      return " + " + shortExerciseName(segEx) + " " + value;
    })
    .join("");
}

/**
 * Removes every trace of the given exercises: blocks they own and segments they contribute
 * to other blocks (supersets). Returns `null` when the session does not reference them.
 */
export function stripExercises(session: Session, ids: ReadonlySet<string>): Session | null {
  let changed = false;
  const exercises: SessionExercise[] = [];
  for (const block of session.exercises) {
    if (ids.has(block.exerciseId)) {
      changed = true;
      continue;
    }
    const sets: WorkoutSet[] = [];
    for (const set of block.sets) {
      const kept = set.filter((seg) => !ids.has(seg.exId));
      if (kept.length !== set.length) changed = true;
      if (kept.length > 0) sets.push(kept);
    }
    if (sets.length > 0) exercises.push({ ...block, sets });
  }
  return changed ? { ...session, exercises } : null;
}
