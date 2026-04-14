import { useLiveQuery } from "dexie-react-hooks";

import { db } from "~/db/index";

export function useExercises() {
  return useLiveQuery(() => db.exercises.toArray(), []);
}

export function useExercise(id: string) {
  return useLiveQuery(() => db.exercises.get(id), [id]);
}
