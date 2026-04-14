import { Skeleton } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import ExerciseListItem from "~/components/exercises/ExerciseListItem";
import type { Exercise } from "~/db/index";
import { useExercises } from "~/hooks/use-exercises";
import { useSessions } from "~/hooks/use-sessions";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "~/lib/constants";

const ExercisesPage = () => {
  const exercises = useExercises();
  const sessions = useSessions();

  // Build a map of exerciseId → most recent session date
  const lastDateMap: Record<string, string> = {};
  if (sessions) {
    for (const sess of sessions) {
      for (const ex of sess.exercises) {
        const existing = lastDateMap[ex.exerciseId];
        if (!existing || sess.date > existing) {
          lastDateMap[ex.exerciseId] = sess.date;
        }
      }
    }
  }

  const byCategory: Record<string, Exercise[]> =
    exercises?.reduce(
      (acc, ex) => {
        (acc[ex.category] ??= []).push(ex);
        return acc;
      },
      {} as Record<string, Exercise[]>,
    ) ?? {};

  return (
    <div className="px-4 pb-6">
      <header className="py-5">
        <h1 className="text-2xl font-semibold text-gray-900">Exercises</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          {exercises ? `${exercises.length} tracked` : "Loading…"}
        </p>
      </header>

      {exercises === undefined ? (
        <div className="flex flex-col gap-2">
          <Skeleton height={40} radius="xl" />
          <Skeleton height={40} radius="xl" />
          <Skeleton height={40} radius="xl" />
        </div>
      ) : (
        CATEGORY_ORDER.map((cat) => {
          const list = byCategory[cat];
          if (!list?.length) return null;
          return (
            <section key={cat} className="mb-4">
              <h2 className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="flex flex-col gap-1.5">
                {list.map((ex) => (
                  <ExerciseListItem
                    key={ex.id}
                    exercise={ex}
                    lastSessionDate={lastDateMap[ex.id]}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

export const Route = createFileRoute("/exercises/")({
  component: ExercisesPage,
});
