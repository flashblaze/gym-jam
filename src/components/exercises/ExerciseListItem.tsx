import { UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "~/cn";
import { selectableRowClass } from "~/components/selectable-row";
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
      className={cn(selectableRowClass(selectionMode, isSelected), "min-h-14 items-center")}
    >
      {selectionMode && <SelectionIndicator selected={isSelected} />}

      <span className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2.5">
        <span className="min-w-0">
          <span className="block truncate font-display text-lg leading-tight font-bold uppercase text-fg">
            {exercise.name}
          </span>
          {caption && (
            <span className="block truncate text-xs font-bold uppercase tracking-[0.1em] text-fg-faint">
              {caption}
            </span>
          )}
        </span>
        <span className="shrink-0 text-right">
          {summary ? (
            <>
              {summary.lastBest && (
                <span className="block font-display text-lg leading-tight font-bold tabular-nums text-primary-500">
                  {summary.lastBest}
                </span>
              )}
              <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-fg-faint">
                {formatDate(summary.lastDate)}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-faint">
              Not logged
            </span>
          )}
        </span>
      </span>
    </UnstyledButton>
  );
};

export default ExerciseListItem;
