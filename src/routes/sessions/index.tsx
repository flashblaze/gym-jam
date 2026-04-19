import { ActionIcon, Button, Skeleton, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import IconSolarCheckSquareBroken from "~icons/solar/check-square-broken";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";
import IconSolarSettingsBroken from "~icons/solar/settings-broken";

import SessionCard from "~/components/sessions/SessionCard";
import { db } from "~/db/index";
import { useSessions } from "~/hooks/use-sessions";
import { formatDate } from "~/lib/calc";

const SessionsPage = () => {
  const sessions = useSessions();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    modals.openConfirmModal({
      title: "Delete sessions",
      children: (
        <Text size="sm">
          Delete {count} session{count !== 1 ? "s" : ""}? This cannot be undone.
        </Text>
      ),
      labels: { confirm: `Delete (${count})`, cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        void db.sessions.bulkDelete(Array.from(selectedIds)).then(() => {
          exitSelectionMode();
        });
      },
    });
  };

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#d4d4e0]">Workouts</h1>
          <p className="mt-1 text-xs text-[#565670]">
            {sessions ? `${sessions.length} sessions logged` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions &&
            sessions.length > 0 &&
            (selectionMode ? (
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
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => setSelectionMode(true)}
                aria-label="Select sessions"
              >
                <IconSolarCheckSquareBroken className="text-xl" />
              </ActionIcon>
            ))}
          {!selectionMode && (
            <ActionIcon
              component={Link}
              to="/settings"
              variant="default"
              size="lg"
              aria-label="Settings"
            >
              <IconSolarSettingsBroken className="text-xl" />
            </ActionIcon>
          )}
        </div>
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
            <SessionCard
              key={s.id}
              session={s}
              onDelete={() => handleDelete(s.id, s.date)}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(s.id)}
              onToggleSelect={() => toggleSelect(s.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/sessions/")({
  component: SessionsPage,
});
