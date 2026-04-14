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
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#d4d4e0]">Exercises</h1>
          <p className="mt-1 text-xs text-[#565670]">
            {exercises ? `${exercises.length} tracked` : "Loading…"}
          </p>
        </div>
        <ActionIcon variant="default" size="lg" onClick={openDrawer} aria-label="Create exercise">
          <IconSolarAddCircleBroken className="text-xl" />
        </ActionIcon>
      </header>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton height={48} radius="xl" />
          <Skeleton height={48} radius="xl" />
          <Skeleton height={48} radius="xl" />
        </div>
      ) : (
        categories.map((cat) => {
          const list = byCategory[cat.id];
          if (!list?.length) return null;
          return (
            <section key={cat.id} className="mb-5">
              <h2 className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-widest text-[#565670]">
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
