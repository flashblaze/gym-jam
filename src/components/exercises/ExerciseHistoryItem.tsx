import type { ExerciseHistoryEntry } from "~/hooks/use-exercise-history";
import { formatDate, formatDuration } from "~/lib/calc";

interface ExerciseHistoryItemProps {
  entry: ExerciseHistoryEntry;
}

const ExerciseHistoryItem = ({ entry }: ExerciseHistoryItemProps) => {
  const isTimed = entry.bestTime > 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#18182a] px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-[#d4d4e0]">{formatDate(entry.date)}</span>
        <span className="text-xs font-medium text-[#f59e0b]">
          {isTimed ? formatDuration(entry.bestTime) : `${entry.maxWeight} kg`}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-[#565670]">{entry.sets.join(" · ")}</p>
    </div>
  );
};

export default ExerciseHistoryItem;
