import { UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import IconSolarAltArrowRightBroken from "~icons/solar/alt-arrow-right-broken";

import type { ExerciseHistoryEntry } from "~/hooks/use-exercise-history";
import { formatDate, formatDuration } from "~/lib/calc";

interface ExerciseHistoryItemProps {
  entry: ExerciseHistoryEntry;
}

const ExerciseHistoryItem = ({ entry }: ExerciseHistoryItemProps) => {
  const navigate = useNavigate();
  const isTimed = entry.bestTime > 0;

  return (
    <UnstyledButton
      onClick={() =>
        void navigate({ to: "/sessions/$sessionId", params: { sessionId: entry.sessionId } })
      }
      className="w-full rounded-xl border border-white/6 bg-[#18182a] px-4 py-3 transition-colors hover:border-white/[0.14] hover:bg-[#1e1e32]"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-[#d4d4e0]">{formatDate(entry.date)}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary-500">
            {isTimed ? formatDuration(entry.bestTime) : `${entry.maxWeight} kg`}
          </span>
          <IconSolarAltArrowRightBroken className="text-xs text-[#565670]" />
        </div>
      </div>
      <p className="mt-1 font-mono text-xs text-[#565670]">{entry.sets.join(" · ")}</p>
    </UnstyledButton>
  );
};

export default ExerciseHistoryItem;
