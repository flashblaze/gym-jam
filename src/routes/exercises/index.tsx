import { ActionIcon, Button, Chip, CloseButton, Skeleton, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconSolarCheckSquareBroken from "~icons/solar/check-square-broken";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";
import IconSolarMagniferBroken from "~icons/solar/magnifer-broken";

import EmptyState from "~/components/EmptyState";
import CreateExerciseDrawer from "~/components/exercises/CreateExerciseDrawer";
import ExerciseListItem from "~/components/exercises/ExerciseListItem";
import { deleteExercises } from "~/db/delete-exercises";
import type { Exercise } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises, useExercisesById } from "~/hooks/use-exercises";
import { useSelection } from "~/hooks/use-selection";
import { useSessions } from "~/hooks/use-sessions";
import { pluralize } from "~/lib/calc";
import { countSessionsUsing, exerciseSummaries } from "~/lib/progress";

const EXERCISES_SCROLL_KEY = "exercises-list-scroll";
const ALL_CATEGORIES = "all";

const notifyDeleteFailed = (err: unknown) => {
  notifications.show({
    title: "Delete failed",
    message: err instanceof Error ? err.message : "Could not delete the exercises.",
    color: "red",
  });
};

const byName = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name);

const ExercisesPage = () => {
  const exercises = useExercises();
  const exercisesById = useExercisesById();
  const sessions = useSessions();
  const categories = useCategories();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const { selectionMode, selectedIds, toggle, startWith, enter, exit } = useSelection();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  useEffect(() => {
    const raw = sessionStorage.getItem(EXERCISES_SCROLL_KEY);
    const main = document.querySelector("main");
    if (raw != null && main) {
      const y = Number.parseInt(raw, 10);
      if (!Number.isNaN(y)) main.scrollTop = y;
    }
    return () => {
      const mainEl = document.querySelector("main");
      if (mainEl) sessionStorage.setItem(EXERCISES_SCROLL_KEY, String(mainEl.scrollTop));
    };
  }, []);

  const summaries = useMemo(
    () => (sessions && exercisesById ? exerciseSummaries(sessions, exercisesById) : {}),
    [sessions, exercisesById],
  );

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    const affected = countSessionsUsing(sessions ?? [], selectedIds);
    modals.openConfirmModal({
      title: "Delete exercises",
      children: (
        <p className="text-sm text-fg-muted">
          Delete {pluralize(ids.length, "exercise")}?
          {affected > 0 &&
            ` Their sets will also be removed from ${pluralize(affected, "workout")}.`}{" "}
          This cannot be undone.
        </p>
      ),
      labels: { confirm: `Delete (${ids.length})`, cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => void deleteExercises(ids).then(exit).catch(notifyDeleteFailed),
    });
  };

  if (exercises === undefined || categories === undefined) {
    return (
      <div className="flex flex-col gap-2 px-4 py-6">
        <Skeleton height={36} width={160} mb={8} />
        <Skeleton height={42} radius="md" mb={8} />
        <Skeleton height={56} radius="xl" />
        <Skeleton height={56} radius="xl" />
        <Skeleton height={56} radius="xl" />
      </div>
    );
  }

  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const usedCategories = categories.filter((c) => exercises.some((ex) => ex.category === c.id));
  const q = searchQuery.trim().toLowerCase();
  const visible = exercises.filter(
    (ex) =>
      (categoryFilter === ALL_CATEGORIES || ex.category === categoryFilter) &&
      (!q || ex.name.toLowerCase().includes(q)),
  );

  const renderItems = (list: Exercise[], withCaption: boolean) => (
    <ul className="flex flex-col gap-1.5">
      {list.map((ex) => (
        <li key={ex.id}>
          <ExerciseListItem
            exercise={ex}
            summary={summaries[ex.id]}
            caption={withCaption ? categoryNames[ex.category] : undefined}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(ex.id)}
            onToggleSelect={() => toggle(ex.id)}
            onLongPress={() => startWith(ex.id)}
          />
        </li>
      ))}
    </ul>
  );

  let content: ReactNode;
  if (exercises.length === 0) {
    content = (
      <EmptyState
        message="No exercises yet."
        action={
          <Button size="md" leftSection={<IconSolarAddCircleBroken />} onClick={openDrawer}>
            Create an exercise
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        message="No exercises match."
        action={
          q && (
            <Button variant="light" leftSection={<IconSolarAddCircleBroken />} onClick={openDrawer}>
              Create “{searchQuery.trim()}”
            </Button>
          )
        }
      />
    );
  } else if (categoryFilter === ALL_CATEGORIES && !q) {
    content = usedCategories.map((cat) => (
      <section key={cat.id} className="mb-5">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-fg-faint">
          {cat.name}
        </h2>
        {renderItems(visible.filter((ex) => ex.category === cat.id).sort(byName), false)}
      </section>
    ));
  } else {
    content = renderItems([...visible].sort(byName), categoryFilter === ALL_CATEGORIES);
  }

  return (
    <div className="pb-6">
      <header className="flex items-center justify-between px-4 pt-6 pb-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Exercises</h1>
          <p className="mt-1 text-xs text-fg-faint">{pluralize(exercises.length, "exercise")}</p>
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
              <ActionIcon variant="default" size="lg" onClick={exit} aria-label="Cancel selection">
                <IconSolarCloseCircleBroken className="text-xl" />
              </ActionIcon>
            </>
          ) : (
            <>
              {exercises.length > 0 && (
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={enter}
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

      {exercises.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-surface px-4 pt-1 pb-3">
          <TextInput
            aria-label="Search exercises"
            placeholder="Search exercises"
            size="md"
            leftSection={<IconSolarMagniferBroken />}
            rightSection={
              searchQuery && (
                <CloseButton aria-label="Clear search" onClick={() => setSearchQuery("")} />
              )
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <Chip.Group
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value || ALL_CATEGORIES)}
          >
            <div
              role="radiogroup"
              aria-label="Filter by category"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
            >
              <Chip value={ALL_CATEGORIES} size="sm" className="shrink-0">
                All
              </Chip>
              {usedCategories.map((cat) => (
                <Chip key={cat.id} value={cat.id} size="sm" className="shrink-0">
                  {cat.name}
                </Chip>
              ))}
            </div>
          </Chip.Group>
        </div>
      )}

      <div className="px-4">{content}</div>

      <CreateExerciseDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        categories={categories}
        initialName={searchQuery.trim()}
      />
    </div>
  );
};

export const Route = createFileRoute("/exercises/")({
  component: ExercisesPage,
});
