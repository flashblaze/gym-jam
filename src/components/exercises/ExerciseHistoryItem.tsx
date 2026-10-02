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
      className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-hover"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-fg">{formatSessionDate(entry.date)}</span>
        <span className="flex items-center gap-2">
          {entry.isPr && (
            <Badge size="sm" variant="light">
              PR
            </Badge>
          )}
          {value !== undefined && (
            <span className="text-xs font-medium text-primary-500">
              {METRIC_INFO[headline].format(value)}
            </span>
          )}
          <IconSolarAltArrowRightBroken className="text-xs text-fg-faint" />
        </span>
      </span>
      <span className="mt-1 block font-mono text-xs text-fg-subtle">{entry.sets.join(" · ")}</span>
    </UnstyledButton>
  );
};

export default ExerciseHistoryItem;
