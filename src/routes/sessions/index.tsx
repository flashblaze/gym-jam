import { Skeleton, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { createFileRoute } from "@tanstack/react-router";

import SessionCard from "~/components/sessions/SessionCard";
import { db } from "~/db/index";
import { useSessions } from "~/hooks/use-sessions";
import { formatDate } from "~/lib/calc";

const SessionsPage = () => {
  const sessions = useSessions();

  const handleDelete = (id: string, date: string) => {
    modals.openConfirmModal({
      title: "Delete session",
      children: (
        <Text size="sm">Delete the session from {formatDate(date)}? This cannot be undone.</Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => void db.sessions.delete(id),
    });
  };

  return (
    <div className="px-4 pb-6">
      <header className="py-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#d4d4e0]">Workouts</h1>
        <p className="mt-1 text-xs text-[#565670]">
          {sessions ? `${sessions.length} sessions logged` : "Loading…"}
        </p>
      </header>

      <div className="flex flex-col gap-2">
        {sessions === undefined ? (
          <>
            <Skeleton height={64} radius="xl" />
            <Skeleton height={64} radius="xl" />
            <Skeleton height={64} radius="xl" />
          </>
        ) : sessions.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#565670]">
            No sessions yet. Tap + to log one.
          </p>
        ) : (
          sessions.map((s) => (
            <SessionCard key={s.id} session={s} onDelete={() => handleDelete(s.id, s.date)} />
          ))
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/sessions/")({
  component: SessionsPage,
});
