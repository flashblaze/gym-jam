import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { db, type Exercise } from "~/db/index";

export function useExercises() {
  return useLiveQuery(() => db.exercises.toArray(), []);
}

export function useExercisesById(): Record<string, Exercise> | undefined {
  const exercises = useExercises();
  return useMemo(
    () => exercises && Object.fromEntries(exercises.map((ex) => [ex.id, ex])),
    [exercises],
  );
}

/** `undefined` while loading, `null` when no exercise has this id. */
export function useExercise(id: string) {
  return useLiveQuery(async () => (await db.exercises.get(id)) ?? null, [id]);
}
