import { ActionIcon, Button } from "@mantine/core";
import { useEffect, useState } from "react";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";

import { cn } from "~/cn";
import { haptic } from "~/lib/haptics";

interface RestTimerProps {
  /** Countdown length in seconds; 0 counts up instead. */
  targetSeconds: number;
  onDismiss: () => void;
}

const EXTEND_SECONDS = 30;
const SEGMENT_COUNT = 10;

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
  const litSegments =
    target > 0 ? Math.min(SEGMENT_COUNT, Math.floor((elapsed / target) * SEGMENT_COUNT)) : 0;

  useEffect(() => {
    if (restOver) haptic([200, 100, 200]);
  }, [restOver]);

  let clock = formatClock(elapsed);
  if (countingDown) clock = formatClock(target - elapsed);
  else if (restOver) clock = "+" + formatClock(elapsed - target);

  return (
    <aside
      aria-label="Rest timer"
      className={cn(
        "sticky bottom-0 mx-4 mt-4 flex items-center gap-3 bg-primary-500 py-1.5 pr-1.5 pl-3 text-surface shadow-lg",
        restOver && "motion-safe:animate-flash",
      )}
    >
      <span className="w-10 text-xs leading-tight font-bold uppercase tracking-[0.16em]">
        {restOver ? "Go" : "Rest"}
      </span>
      <span
        className="font-display text-[40px] leading-none font-extrabold tabular-nums"
        role="timer"
        aria-live="off"
      >
        {clock}
      </span>
      {/* Announced once, instead of every tick. */}
      <span className="sr-only" role="status">
        {restOver ? "Rest over" : ""}
      </span>
      <span aria-hidden className="grid flex-1 grid-cols-10 gap-[3px]">
        {target > 0 &&
          Array.from({ length: SEGMENT_COUNT }, (_, i) => (
            <span key={i} className={cn("h-4", i < litSegments ? "bg-surface" : "bg-surface/20")} />
          ))}
      </span>
      {target > 0 && (
        <Button
          size="compact-md"
          variant="transparent"
          className="border-2 border-solid border-surface text-surface"
          onClick={() => setExtra((e) => e + EXTEND_SECONDS)}
          aria-label={`Add ${EXTEND_SECONDS} seconds`}
        >
          +{EXTEND_SECONDS}
        </Button>
      )}
      <ActionIcon
        size="lg"
        variant="transparent"
        className="text-surface"
        onClick={onDismiss}
        aria-label="Dismiss rest timer"
      >
        <IconSolarCloseCircleBroken className="text-xl" />
      </ActionIcon>
    </aside>
  );
};

export default RestTimer;
