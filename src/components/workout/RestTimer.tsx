import { ActionIcon, Button } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";

import { cn } from "~/cn";
import { haptic } from "~/lib/haptics";
import {
  type RestTimerState,
  extendRestTimer,
  isRestTimerExpired,
  stopRestTimer,
} from "~/lib/rest-timer";

interface RestTimerProps {
  timer: RestTimerState;
}

const EXTEND_SECONDS = 30;
const SEGMENT_COUNT = 10;

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** The running rest timer; shown app-wide by AppShell so it survives navigation. */
const RestTimer = ({ timer }: RestTimerProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      if (isRestTimerExpired(timer, t)) stopRestTimer();
      else setNow(t);
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  const elapsed = Math.max(0, Math.floor((now - timer.startedAt) / 1000));
  const target = timer.targetSeconds > 0 ? timer.targetSeconds + timer.extraSeconds : 0;
  const countingDown = target > 0 && elapsed < target;
  const restOver = target > 0 && elapsed >= target;
  const litSegments =
    target > 0 ? Math.min(SEGMENT_COUNT, Math.floor((elapsed / target) * SEGMENT_COUNT)) : 0;

  // Only buzz when rest ends while on screen, not when returning to an already-finished timer.
  const wasOver = useRef(restOver);
  useEffect(() => {
    if (restOver && !wasOver.current) haptic([200, 100, 200]);
    wasOver.current = restOver;
  }, [restOver]);

  let clock = formatClock(elapsed);
  if (countingDown) clock = formatClock(target - elapsed);
  else if (restOver) clock = "+" + formatClock(elapsed - target);

  return (
    <aside
      aria-label="Rest timer"
      className={cn(
        "mx-3 mb-2 flex items-center gap-3 bg-primary-500 py-1.5 pr-1.5 pl-3 text-surface shadow-lg",
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
          onClick={() => extendRestTimer(EXTEND_SECONDS)}
          aria-label={`Add ${EXTEND_SECONDS} seconds`}
        >
          +{EXTEND_SECONDS}
        </Button>
      )}
      <ActionIcon
        size="lg"
        variant="transparent"
        className="text-surface"
        onClick={stopRestTimer}
        aria-label="Dismiss rest timer"
      >
        <IconSolarCloseCircleBroken className="text-xl" />
      </ActionIcon>
    </aside>
  );
};

export default RestTimer;
