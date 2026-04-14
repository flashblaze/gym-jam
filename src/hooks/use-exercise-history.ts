import { useLiveQuery } from "dexie-react-hooks";

import { db } from "~/db/index";

export interface ExerciseHistoryEntry {
  date: string;
  maxWeight: number;
  sets: string[]; // formatted set strings for display
}

export function useExerciseHistory(exerciseId: string) {
  return useLiveQuery(async () => {
    const sessions = await db.sessions.orderBy("date").toArray();
    const entries: ExerciseHistoryEntry[] = [];

    for (const sess of sessions) {
      for (const exEntry of sess.exercises) {
        if (exEntry.exerciseId !== exerciseId) continue;
        let maxWeight = 0;
        const setStrs: string[] = [];

        for (const set of exEntry.sets) {
          for (const seg of set) {
            if (seg.exId === exerciseId && seg.w != null && seg.w > maxWeight) {
              maxWeight = seg.w;
            }
          }
          const own = set
            .filter((seg) => seg.exId === exerciseId)
            .map((seg) => (seg.w != null ? seg.w + "×" : "×") + seg.r)
            .join("→");
          setStrs.push(own);
        }

        entries.push({ date: sess.date, maxWeight, sets: setStrs });
      }
    }

    return entries;
  }, [exerciseId]);
}
