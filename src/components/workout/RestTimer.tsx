import { ActionIcon, Button, Progress } from "@mantine/core";
import { useEffect, useState } from "react";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";
import IconSolarStopwatchBroken from "~icons/solar/stopwatch-broken";

import { cn } from "~/cn";
import { haptic } from "~/lib/haptics";

interface RestTimerProps {
  /** Countdown length in seconds; 0 counts up instead. */
  targetSeconds: number;
  onDismiss: () => void;
}

const EXTEND_SECONDS = 30;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Starts when it mounts; remount (via `key`) to restart. */
const RestTimer = ({ targetSeconds, onDismiss }: RestTimerProps) => {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const target = targetSeconds > 0 ? targetSeconds + extra : 0;
  const countingDown = target > 0 && elapsed < target;
  const restOver = target > 0 && elapsed >= target;

  useEffect(() => {
    if (restOver) haptic([200, 100, 200]);
  }, [restOver]);

  let clock = formatClock(elapsed);
  if (countingDown) clock = formatClock(target - elapsed);
  else if (restOver) clock = "+" + formatClock(elapsed - target);

  return (
    <aside
      aria-label="Rest timer"
      className="sticky bottom-0 mx-4 mt-4 overflow-hidden rounded-xl border border-line bg-surface-hover shadow-lg"
    >
      <div className="flex items-center gap-3 px-4 py-2">
        <IconSolarStopwatchBroken
          className={cn("text-lg", restOver ? "text-green-500" : "text-primary-500")}
        />
        <span className={cn("text-sm", restOver ? "text-green-500" : "text-fg-subtle")}>
          {restOver ? "Rest over" : "Rest"}
        </span>
        <span className="font-mono text-lg font-semibold text-fg" role="timer" aria-live="off">
          {clock}
        </span>
        {/* Announced once, instead of every tick. */}
        <span className="sr-only" role="status">
          {restOver ? "Rest over" : ""}
        </span>
        {target > 0 && (
          <Button
            size="compact-sm"
            variant="subtle"
            color="gray"
            className="ml-auto"
            onClick={() => setExtra((e) => e + EXTEND_SECONDS)}
          >
            +{EXTEND_SECONDS}s
          </Button>
        )}
        <ActionIcon
          size="lg"
          variant="subtle"
          color="gray"
          className={cn(target === 0 && "ml-auto")}
          onClick={onDismiss}
          aria-label="Dismiss rest timer"
        >
          <IconSolarCloseCircleBroken className="text-lg" />
        </ActionIcon>
      </div>
      {target > 0 && (
        <Progress
          size="xs"
          radius={0}
          color={restOver ? "green" : "primary"}
          value={Math.min(100, (elapsed / target) * 100)}
          aria-label="Rest progress"
        />
      )}
    </aside>
  );
};

export default RestTimer;
