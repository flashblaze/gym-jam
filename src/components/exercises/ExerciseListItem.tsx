import { UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "~/cn";
import SelectionIndicator from "~/components/SelectionIndicator";
import type { Exercise } from "~/db/index";
import { useLongPressSelect } from "~/hooks/use-long-press-select";
import { formatDate } from "~/lib/calc";
import type { ExerciseSummary } from "~/lib/progress";

interface ExerciseListItemProps {
  exercise: Exercise;
  summary: ExerciseSummary | undefined;
  /** Shown under the name, e.g. the category when the list is not grouped. */
  caption?: string;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onLongPress: () => void;
}

const ExerciseListItem = ({
  exercise,
  summary,
  caption,
  selectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}: ExerciseListItemProps) => {
  const navigate = useNavigate();
  const longPress = useLongPressSelect(onLongPress);

  return (
    <UnstyledButton
      {...longPress.handlers}
      onClick={() => {
        if (longPress.consumeClick()) return;
        if (selectionMode) {
          onToggleSelect();
        } else {
          void navigate({ to: "/exercises/$exerciseId", params: { exerciseId: exercise.id } });
        }
      }}
      aria-pressed={selectionMode ? isSelected : undefined}
      className={cn(
        "flex min-h-14 w-full select-none items-center overflow-hidden rounded-xl border transition-colors duration-150 [-webkit-touch-callout:none]",
        selectionMode && isSelected
          ? "border-primary-500/40 bg-surface-hover"
          : "border-line bg-surface-raised hover:border-line-strong",
      )}
    >
      {selectionMode && <SelectionIndicator selected={isSelected} />}

      <span className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-fg">{exercise.name}</span>
          {caption && <span className="block truncate text-xs text-fg-faint">{caption}</span>}
        </span>
        <span className="shrink-0 text-right">
          {summary ? (
            <>
              {summary.lastBest && (
                <span className="block font-mono text-xs text-primary-500">{summary.lastBest}</span>
              )}
              <span className="block text-xs text-fg-faint">{formatDate(summary.lastDate)}</span>
            </>
          ) : (
            <span className="text-xs text-fg-faint">Not logged yet</span>
          )}
        </span>
      </span>
    </UnstyledButton>
  );
};

export default ExerciseListItem;
