import { ActionIcon, Button, Skeleton } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Link, createFileRoute } from "@tanstack/react-router";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconSolarCheckSquareBroken from "~icons/solar/check-square-broken";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";

import Delayed from "~/components/Delayed";
import EmptyState from "~/components/EmptyState";
import PageHeader from "~/components/PageHeader";
import SectionHeading from "~/components/SectionHeading";
import SessionCard from "~/components/sessions/SessionCard";
import { deleteSessions } from "~/db/delete-sessions";
import { useExercisesById } from "~/hooks/use-exercises";
import { useSelection } from "~/hooks/use-selection";
import { useSessions } from "~/hooks/use-sessions";
import { formatVolume, pluralize, todayIso } from "~/lib/calc";
import { formatWeekLabel, groupByWeek } from "~/lib/history";

const notifyDeleteFailed = (err: unknown) => {
  notifications.show({
    title: "Delete failed",
    message: err instanceof Error ? err.message : "Could not delete the workouts.",
    color: "red",
  });
};

const HistoryPage = () => {
  const sessions = useSessions();
  const exercises = useExercisesById();
  const { selectionMode, selectedIds, toggle, startWith, enter, exit } = useSelection();

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    modals.openConfirmModal({
      title: "Delete workouts",
      children: (
        <p className="text-sm text-fg-muted">
          Delete {pluralize(count, "workout")}? This cannot be undone.
        </p>
      ),
      labels: { confirm: `Delete (${count})`, cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        void deleteSessions((sessions ?? []).filter((s) => selectedIds.has(s.id)))
          .then(exit)
          .catch(notifyDeleteFailed),
    });
  };

  const today = todayIso();
  const loading = sessions === undefined || exercises === undefined;

  let content;
  if (loading) {
    content = (
      <Delayed>
        <div className="flex flex-col gap-2 px-4">
          <Skeleton height={20} width={120} mb={4} />
          <Skeleton height={92} />
          <Skeleton height={92} />
          <Skeleton height={92} />
        </div>
      </Delayed>
    );
  } else if (sessions.length === 0) {
    content = (
      <EmptyState
        message="No workouts logged yet."
        action={
          <Button
            renderRoot={(props) => <Link {...props} to="/workout/$date" params={{ date: today }} />}
            size="md"
            leftSection={<IconSolarAddCircleBroken />}
          >
            Start today&apos;s workout
          </Button>
        }
      />
    );
  } else {
    content = groupByWeek(sessions).map((week) => (
      <section key={week.weekStart} aria-label={formatWeekLabel(week.weekStart, today)}>
        <header className="sticky top-0 z-10 flex items-baseline justify-between border-b-2 border-fg bg-surface px-4 pt-5 pb-1">
          <SectionHeading className="text-fg">
            {formatWeekLabel(week.weekStart, today)}
          </SectionHeading>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-fg-faint">
            {pluralize(week.sessions.length, "workout")} · {formatVolume(week.volume)}
          </p>
        </header>
        <ul className="px-4">
          {week.sessions.map((s) => (
            <li key={s.id}>
              <SessionCard
                session={s}
                exercises={exercises}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(s.id)}
                onToggleSelect={() => toggle(s.id)}
                onLongPress={() => startWith(s.id)}
              />
            </li>
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="History"
        subtitle={sessions ? `${pluralize(sessions.length, "workout")} logged` : "Loading…"}
        actions={
          <>
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
                  onClick={exit}
                  aria-label="Cancel selection"
                >
                  <IconSolarCloseCircleBroken className="text-xl" />
                </ActionIcon>
              </>
            ) : (
              sessions &&
              sessions.length > 0 && (
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={enter}
                  aria-label="Select workouts"
                >
                  <IconSolarCheckSquareBroken className="text-xl" />
                </ActionIcon>
              )
            )}
          </>
        }
      />

      {content}
    </div>
  );
};

export const Route = createFileRoute("/sessions/")({
  component: HistoryPage,
});
