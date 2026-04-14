import { ActionIcon, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";

import CreateExerciseDrawer from "~/components/exercises/CreateExerciseDrawer";
import ExerciseListItem from "~/components/exercises/ExerciseListItem";
import type { Exercise } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises } from "~/hooks/use-exercises";
import { useSessions } from "~/hooks/use-sessions";

const ExercisesPage = () => {
  const exercises = useExercises();
  const sessions = useSessions();
  const categories = useCategories();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

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

  const loading = exercises === undefined || categories === undefined;

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Exercises</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {exercises ? `${exercises.length} tracked` : "Loading…"}
          </p>
        </div>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={openDrawer}
          aria-label="Create exercise"
        >
          <IconSolarAddCircleBroken className="text-xl" />
        </ActionIcon>
      </header>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton height={40} radius="xl" />
          <Skeleton height={40} radius="xl" />
          <Skeleton height={40} radius="xl" />
        </div>
      ) : (
        categories.map((cat) => {
          const list = byCategory[cat.id];
          if (!list?.length) return null;
          return (
            <section key={cat.id} className="mb-4">
              <h2 className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                {cat.name}
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

      {categories && (
        <CreateExerciseDrawer opened={drawerOpened} onClose={closeDrawer} categories={categories} />
      )}
    </div>
  );
};

export const Route = createFileRoute("/exercises/")({
  component: ExercisesPage,
});
