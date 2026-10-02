import { ActionIcon, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";
import IconSolarPenBroken from "~icons/solar/pen-broken";

import EmptyState from "~/components/EmptyState";
import EditExerciseDrawer from "~/components/exercises/EditExerciseDrawer";
import ExerciseHistoryItem from "~/components/exercises/ExerciseHistoryItem";
import ProgressChart from "~/components/exercises/ProgressChart";
import { deleteExercises } from "~/db/delete-exercises";
import { useCategories } from "~/hooks/use-categories";
import { useExercise } from "~/hooks/use-exercises";
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

  const history = useMemo(
    () => (exercise && sessions ? exerciseHistory(sessions, exercise) : undefined),
    [exercise, sessions],
  );

  useEffect(() => {
    if (exercise === null) void navigate({ to: "/exercises" });
  }, [exercise, navigate]);

  if (!exercise || history === undefined || categories === undefined) {
    return (
      <div className="px-4 py-5">
        <Skeleton height={28} width={120} mb={8} />
        <Skeleton height={24} width={200} mb={16} />
        <Skeleton height={140} radius="xl" mb={12} />
        <Skeleton height={200} radius="xl" />
      </div>
    );
  }

  const metrics = METRICS_BY_TYPE[exercise.type];
  const categoryName = categories.find((c) => c.id === exercise.category)?.name;

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">{exercise.name}</h1>
        <p className="mt-0.5 text-xs text-fg-faint">
          {[TYPE_LABELS[exercise.type], categoryName].filter(Boolean).join(" · ")}
        </p>
      </header>

      {history.length === 0 ? (
        <EmptyState message="Not logged yet. Add it to a workout to start tracking progress." />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 px-4 py-4">
            {metrics.map((metric) => {
              const record = bestOf(history, metric);
              if (!record) return null;
              return (
                <div
                  key={metric}
                  className="rounded-xl border border-line bg-surface-raised px-4 py-3"
                >
                  <dt className="text-xs font-medium text-fg-faint">{METRIC_INFO[metric].label}</dt>
                  <dd className="mt-1 text-xl font-bold text-primary-500">
                    {METRIC_INFO[metric].format(record.value)}
                  </dd>
                  <dd className="mt-0.5 text-xs text-fg-faint">{formatDate(record.date)}</dd>
                </div>
              );
            })}
            <div className="rounded-xl border border-line bg-surface-raised px-4 py-3">
              <dt className="text-xs font-medium text-fg-faint">Workouts</dt>
              <dd className="mt-1 text-xl font-bold text-primary-500">{history.length}</dd>
              <dd className="mt-0.5 text-xs text-fg-faint">since {formatDate(history[0].date)}</dd>
            </div>
          </dl>

          <ProgressChart history={history} metrics={metrics} />

          <section aria-labelledby="history-heading" className="px-4">
            <h2
              id="history-heading"
              className="mb-2 text-xs font-medium uppercase tracking-widest text-fg-faint"
            >
              History
            </h2>
            <ul className="flex flex-col gap-1.5">
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
        onDelete={handleDelete}
      />
    </div>
  );
};

export const Route = createFileRoute("/exercises/$exerciseId")({
  component: ExerciseDetailPage,
});
