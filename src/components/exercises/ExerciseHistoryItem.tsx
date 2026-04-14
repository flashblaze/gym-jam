import type { ExerciseHistoryEntry } from "~/hooks/use-exercise-history";
import { formatDate } from "~/lib/calc";

interface ExerciseHistoryItemProps {
  entry: ExerciseHistoryEntry;
}

const ExerciseHistoryItem = ({ entry }: ExerciseHistoryItemProps) => {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</span>
        <span className="text-xs text-gray-400">top {entry.maxWeight}kg</span>
      </div>
      <p className="mt-0.5 font-mono text-xs text-gray-500">{entry.sets.join(" · ")}</p>
    </div>
  );
};

export default ExerciseHistoryItem;
