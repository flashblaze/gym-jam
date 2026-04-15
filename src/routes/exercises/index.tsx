import { ActionIcon, Button, Skeleton, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconSolarCheckSquareBroken from "~icons/solar/check-square-broken";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";

import CreateExerciseDrawer from "~/components/exercises/CreateExerciseDrawer";
import ExerciseListItem from "~/components/exercises/ExerciseListItem";
import type { Exercise } from "~/db/index";
import { db } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises } from "~/hooks/use-exercises";
import { useSessions } from "~/hooks/use-sessions";

const ExercisesPage = () => {
  const exercises = useExercises();
  const sessions = useSessions();
  const categories = useCategories();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = (exercise: Exercise) => {
    modals.openConfirmModal({
      title: "Delete exercise",
      children: (
        <Text size="sm">
          Delete &ldquo;{exercise.name}&rdquo;? This will also remove it from all sessions. This
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        void db
          .transaction("rw", [db.exercises, db.sessions], async () => {
            await db.exercises.delete(exercise.id);
            const allSessions = await db.sessions.toArray();
            for (const sess of allSessions) {
              const filtered = sess.exercises.filter((e) => e.exerciseId !== exercise.id);
              if (filtered.length !== sess.exercises.length) {
                await db.sessions.put({ ...sess, exercises: filtered });
              }
            }
          })
          .catch(() => {});
      },
    });
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    const ids = Array.from(selectedIds);
    modals.openConfirmModal({
      title: "Delete exercises",
      children: (
        <Text size="sm">
          Delete {count} exercise{count !== 1 ? "s" : ""}? They will also be removed from all
          sessions. This cannot be undone.
        </Text>
      ),
      labels: { confirm: `Delete (${count})`, cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        void db
          .transaction("rw", [db.exercises, db.sessions], async () => {
            await db.exercises.bulkDelete(ids);
            const allSessions = await db.sessions.toArray();
            for (const sess of allSessions) {
              const filtered = sess.exercises.filter((e) => !ids.includes(e.exerciseId));
              if (filtered.length !== sess.exercises.length) {
                await db.sessions.put({ ...sess, exercises: filtered });
              }
            }
          })
          .then(() => exitSelectionMode())
          .catch(() => {});
      },
    });
  };

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#d4d4e0]">Exercises</h1>
          <p className="mt-1 text-xs text-[#565670]">
            {exercises ? `${exercises.length} tracked` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <>
              <Button
                variant="filled"
                color="red"
                size="xs"
                disabled={selectedIds.size === 0}
                onClick={handleBulkDelete}
              >
                Delete ({selectedIds.size})
              </Button>
              <ActionIcon
                variant="default"
                size="lg"
                onClick={exitSelectionMode}
                aria-label="Cancel selection"
              >
                <IconSolarCloseCircleBroken className="text-xl" />
              </ActionIcon>
            </>
          ) : (
            <>
              {exercises && exercises.length > 0 && (
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={() => setSelectionMode(true)}
                  aria-label="Select exercises"
                >
                  <IconSolarCheckSquareBroken className="text-xl" />
                </ActionIcon>
              )}
              <ActionIcon
                variant="default"
                size="lg"
                onClick={openDrawer}
                aria-label="Create exercise"
              >
                <IconSolarAddCircleBroken className="text-xl" />
              </ActionIcon>
            </>
          )}
        </div>
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
                    onDelete={() => handleDelete(ex)}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(ex.id)}
                    onToggleSelect={() => toggleSelect(ex.id)}
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
