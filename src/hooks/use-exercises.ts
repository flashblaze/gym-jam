import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { db, type Exercise } from "~/db/index";

import { createLiveCache, useCachedLiveQuery } from "./cached-live-query";

export const exercisesCache = createLiveCache(() => db.exercises.toArray());

interface ExerciseQueryOptions {
  /** Skip the cached result; for state that is seeded once and then saved. */
  fresh?: boolean;
}

export function useExercises(options?: ExerciseQueryOptions) {
  return useCachedLiveQuery(exercisesCache, options);
}

export function useExercisesById(
  options?: ExerciseQueryOptions,
): Record<string, Exercise> | undefined {
  const exercises = useExercises(options);
  return useMemo(
    () => exercises && Object.fromEntries(exercises.map((ex) => [ex.id, ex])),
    [exercises],
  );
}

/** `undefined` while loading, `null` when no exercise has this id. */
export function useExercise(id: string) {
  return useLiveQuery(
    async () => (await db.exercises.get(id)) ?? null,
    [id],
    exercisesCache.current()?.find((ex) => ex.id === id),
  );
}
