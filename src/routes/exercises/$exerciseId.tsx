import { ActionIcon, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";
import IconSolarPenBroken from "~icons/solar/pen-broken";

import Delayed from "~/components/Delayed";
import EmptyState from "~/components/EmptyState";
import EditExerciseDrawer from "~/components/exercises/EditExerciseDrawer";
import ExerciseHistoryItem from "~/components/exercises/ExerciseHistoryItem";
import ProgressChart from "~/components/exercises/ProgressChart";
import SectionHeading from "~/components/SectionHeading";
import StatTile from "~/components/StatTile";
import ExercisePickerDrawer from "~/components/workout/ExercisePickerDrawer";
import { deleteExercises } from "~/db/delete-exercises";
import { mergeExercises } from "~/db/merge-exercises";
import { useCategories } from "~/hooks/use-categories";
import { useExercise, useExercises } from "~/hooks/use-exercises";
import { useSessions } from "~/hooks/use-sessions";
import { formatDate, pluralize } from "~/lib/calc";
import { TYPE_LABELS } from "~/lib/constants";
import { METRICS_BY_TYPE, METRIC_INFO, bestOf, exerciseHistory } from "~/lib/progress";

const ExerciseDetailPage = () => {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const exercise = useExercise(exerciseId);
  const sessions = useSessions();
  const categories = useCategories();
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [mergeOpened, { open: openMerge, close: closeMerge }] = useDisclosure(false);
  const allExercises = useExercises();

  const history = useMemo(
    () => (exercise && sessions ? exerciseHistory(sessions, exercise) : undefined),
    [exercise, sessions],
  );

  useEffect(() => {
    if (exercise === null) void navigate({ to: "/exercises" });
  }, [exercise, navigate]);

  if (!exercise || history === undefined || categories === undefined) {
    return (
      <Delayed>
        <div className="px-4 py-5">
          <Skeleton height={28} width={120} mb={8} />
          <Skeleton height={24} width={200} mb={16} />
          <Skeleton height={140} mb={12} />
          <Skeleton height={200} />
        </div>
      </Delayed>
    );
  }

  const metrics = METRICS_BY_TYPE[exercise.type];
  const categoryName = categories.find((c) => c.id === exercise.category)?.name;

  const confirmMerge = (intoId: string) => {
    closeMerge();
    const into = allExercises?.find((e) => e.id === intoId);
    if (!into) return;
    const setCount = history.reduce((n, entry) => n + entry.sets.length, 0);
    modals.openConfirmModal({
      title: "Merge exercises",
      children: (
        <p className="text-sm text-fg-muted">
          Merge &ldquo;{exercise.name}&rdquo; ({pluralize(setCount, "set")} in{" "}
          {pluralize(history.length, "workout")}) into &ldquo;{into.name}&rdquo;? Its history moves
          over and &ldquo;{exercise.name}&rdquo; is deleted. This cannot be undone.
        </p>
      ),
      labels: { confirm: "Merge", cancel: "Cancel" },
      onConfirm: () =>
        void mergeExercises(exercise.id, into.id)
          .then(() => {
            notifications.show({
              title: "Exercises merged",
              message: `History moved to ${into.name}.`,
              color: "green",
            });
            return navigate({
              to: "/exercises/$exerciseId",
              params: { exerciseId: into.id },
              replace: true,
            });
          })
          .catch((err: unknown) =>
            notifications.show({
              title: "Merge failed",
              message: err instanceof Error ? err.message : "Could not merge the exercises.",
              color: "red",
            }),
          ),
    });
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: "Delete exercise",
      children: (
        <p className="text-sm text-fg-muted">
          Delete &ldquo;{exercise.name}&rdquo;?
          {history.length > 0 &&
            ` Its sets will also be removed from ${pluralize(history.length, "workout")}.`}{" "}
          This cannot be undone.
        </p>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        closeEdit();
        void deleteExercises([exercise.id])
          .then(() => navigate({ to: "/exercises" }))
          .catch((err: unknown) =>
            notifications.show({
              title: "Delete failed",
              message: err instanceof Error ? err.message : "Could not delete the exercise.",
              color: "red",
            }),
          );
      },
    });
  };

  return (
    <div className="pb-6">
      <header className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <ActionIcon
            component={Link}
            to="/exercises"
            size="lg"
            variant="subtle"
            color="gray"
            aria-label="Back to exercises"
          >
            <IconSolarAltArrowLeftBroken className="text-lg" />
          </ActionIcon>
          <ActionIcon
            size="lg"
            variant="subtle"
            color="gray"
            onClick={openEdit}
            aria-label="Edit exercise"
          >
            <IconSolarPenBroken className="text-lg" />
          </ActionIcon>
        </div>
        <h1 className="mt-3 font-display text-[40px] leading-[0.9] font-extrabold uppercase text-fg">
          {exercise.name}
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-fg-subtle">
          {[TYPE_LABELS[exercise.type], categoryName].filter(Boolean).join(" · ")}
        </p>
      </header>

      {history.length === 0 ? (
        <EmptyState message="Not logged yet. Add it to a workout to start tracking progress." />
      ) : (
        <>
          <dl className="mx-4 my-4 grid grid-cols-2 gap-px border border-line bg-line">
            {metrics.map((metric, i) => {
              const record = bestOf(history, metric);
              if (!record) return null;
              return (
                <StatTile
                  key={metric}
                  label={METRIC_INFO[metric].label}
                  value={METRIC_INFO[metric].format(record.value)}
                  caption={formatDate(record.date)}
                  info={METRIC_INFO[metric].description}
                  accent={i === 0}
                />
              );
            })}
            <StatTile
              label="Workouts"
              value={history.length}
              caption={`since ${formatDate(history[0].date)}`}
            />
          </dl>

          <ProgressChart history={history} metrics={metrics} />

          <section aria-labelledby="history-heading" className="px-4">
            <SectionHeading id="history-heading" className="border-b-2 border-fg pb-1 text-fg">
              History
            </SectionHeading>
            <ul>
              {[...history].reverse().map((entry) => (
                <li key={entry.sessionId}>
                  <ExerciseHistoryItem entry={entry} headline={metrics[0]} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <EditExerciseDrawer
        opened={editOpened}
        onClose={closeEdit}
        exercise={exercise}
        categories={categories}
        onMerge={() => {
          closeEdit();
          openMerge();
        }}
        onDelete={handleDelete}
      />

      <ExercisePickerDrawer
        opened={mergeOpened}
        title={`Merge “${exercise.name}” into…`}
        exercises={(allExercises ?? []).filter((e) => e.type === exercise.type)}
        categories={categories}
        pinned={[]}
        excludeIds={new Set([exercise.id])}
        onClose={closeMerge}
        onPick={confirmMerge}
      />
    </div>
  );
};

export const Route = createFileRoute("/exercises/$exerciseId")({
  component: ExerciseDetailPage,
});
