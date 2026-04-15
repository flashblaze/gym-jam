import { useLiveQuery } from "dexie-react-hooks";

import { db } from "~/db/index";

export interface ExerciseHistoryEntry {
  sessionId: string;
  date: string;
  maxWeight: number; // 0 for timed exercises
  bestTime: number; // seconds; 0 for non-timed exercises
  sets: string[]; // formatted set strings for display
}

export function useExerciseHistory(exerciseId: string) {
  return useLiveQuery(async () => {
    const [sessions, exercise] = await Promise.all([
      db.sessions.orderBy("date").toArray(),
      db.exercises.get(exerciseId),
    ]);

    const isTimed = exercise?.type === "timed";
    const entries: ExerciseHistoryEntry[] = [];

    for (const sess of sessions) {
      for (const exEntry of sess.exercises) {
        const blockUsesExercise = exEntry.sets.some((set) =>
          set.some((seg) => seg.exId === exerciseId),
        );
        if (!blockUsesExercise) continue;

        let maxWeight = 0;
        let bestTime = 0;
        const setStrs: string[] = [];

        for (const set of exEntry.sets) {
          for (const seg of set) {
            if (seg.exId !== exerciseId) continue;
            if (isTimed) {
              const r = seg.r ?? 0;
              if (r > bestTime) bestTime = r;
            } else {
              if (seg.w != null && seg.w > maxWeight) maxWeight = seg.w;
            }
          }

          if (isTimed) {
            const own = set
              .filter((seg) => seg.exId === exerciseId)
              .map((seg) => {
                const sec = seg.r ?? 0;
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                if (m === 0) return `${s}s`;
                if (s === 0) return `${m}m`;
                return `${m}m ${s}s`;
              })
              .join("→");
            setStrs.push(own);
          } else {
            const own = set
              .filter((seg) => seg.exId === exerciseId)
              .map((seg) => {
                const rep = seg.r == null ? "—" : String(seg.r);
                return (seg.w != null ? seg.w + "×" : "×") + rep;
              })
              .join("→");
            setStrs.push(own);
          }
        }

        entries.push({ sessionId: sess.id, date: sess.date, maxWeight, bestTime, sets: setStrs });
      }
    }

    return entries;
  }, [exerciseId]);
}
