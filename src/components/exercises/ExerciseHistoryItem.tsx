import { Badge, UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import IconSolarAltArrowRightBroken from "~icons/solar/alt-arrow-right-broken";

import { formatSessionDate } from "~/lib/history";
import { METRIC_INFO, type MetricKey, type SessionPerformance } from "~/lib/progress";

interface ExerciseHistoryItemProps {
  entry: SessionPerformance;
  headline: MetricKey;
}

const ExerciseHistoryItem = ({ entry, headline }: ExerciseHistoryItemProps) => {
  const navigate = useNavigate();
  const value = entry.metrics[headline];

  return (
    <UnstyledButton
      onClick={() =>
        void navigate({
          to: "/workout/$date",
          params: { date: entry.date },
          search: { session: entry.sessionId },
        })
      }
      className="w-full border-b border-line py-3 transition-colors hover:bg-surface-raised"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-lg leading-tight font-bold uppercase text-fg">
          {formatSessionDate(entry.date)}
        </span>
        <span className="flex items-center gap-2">
          {entry.isPr && (
            <Badge size="sm" variant="filled">
              PR
            </Badge>
          )}
          {value !== undefined && (
            <span className="font-display text-lg font-bold tabular-nums text-primary-500">
              {METRIC_INFO[headline].format(value)}
            </span>
          )}
          <IconSolarAltArrowRightBroken className="text-xs text-fg-faint" />
        </span>
      </span>
      <span className="mt-0.5 block font-display text-base tabular-nums text-fg-muted">
        {entry.sets.join(" · ")}
      </span>
    </UnstyledButton>
  );
};

export default ExerciseHistoryItem;
