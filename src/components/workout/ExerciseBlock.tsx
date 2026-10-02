import { ActionIcon, Button, Menu } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconSolarMenuDotsBold from "~icons/solar/menu-dots-bold";

import type { Exercise, Segment } from "~/db/index";
import { formatDate } from "~/lib/calc";
import { DELETED_EXERCISE_LABEL, formatSet } from "~/lib/sets";
import type { DraftBlock, PreviousPerformance } from "~/lib/workout";

import WorkoutSetRow from "./WorkoutSetRow";

interface ExerciseBlockProps {
  block: DraftBlock;
  exercises: Record<string, Exercise>;
  previous: PreviousPerformance | undefined;
  onChangeSegments: (setKey: string, segments: Segment[]) => void;
  onToggleDone: (setKey: string, setIndex: number) => void;
  onAddSet: () => void;
  onAddDrop: (setKey: string) => void;
  onAddSuperset: (setKey: string) => void;
  onRemoveSet: (setKey: string) => void;
  onRemove: () => void;
}

const ExerciseBlock = ({
  block,
  exercises,
  previous,
  onChangeSegments,
  onToggleDone,
  onAddSet,
  onAddDrop,
  onAddSuperset,
  onRemoveSet,
  onRemove,
}: ExerciseBlockProps) => {
  const exercise = exercises[block.exerciseId];
  const doneCount = block.sets.filter((set) => set.done).length;

  return (
    <li className="rounded-xl border border-line bg-surface-raised px-3 pt-3 pb-2">
      <header className="mb-2 flex items-start gap-2 px-1">
        <div className="min-w-0 flex-1">
          {exercise ? (
            <Link
              to="/exercises/$exerciseId"
              params={{ exerciseId: exercise.id }}
              className="text-base font-semibold text-fg no-underline hover:underline"
            >
              {exercise.name}
            </Link>
          ) : (
            <span className="text-base font-semibold text-fg">{DELETED_EXERCISE_LABEL}</span>
          )}
          <p className="mt-0.5 truncate text-xs text-fg-faint">
            {previous
              ? `Last · ${formatDate(previous.date)}: ${previous.sets
                  .map((set) => formatSet(set, block.exerciseId, exercises))
                  .join(" · ")}`
              : "First time logging this exercise"}
          </p>
        </div>
        <span className="pt-1 text-xs text-fg-faint">
          {doneCount}/{block.sets.length}
        </span>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon size="lg" variant="subtle" color="gray" aria-label="Exercise options">
              <IconSolarMenuDotsBold className="text-lg" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item color="red" onClick={onRemove}>
              Remove exercise
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </header>

      <ol className="flex flex-col gap-1">
        {block.sets.map((set, index) => (
          <WorkoutSetRow
            key={set.key}
            set={set}
            index={index}
            primaryExerciseId={block.exerciseId}
            exercises={exercises}
            previous={previous}
            onChangeSegments={(segments) => onChangeSegments(set.key, segments)}
            onToggleDone={() => onToggleDone(set.key, index)}
            onAddDrop={() => onAddDrop(set.key)}
            onAddSuperset={() => onAddSuperset(set.key)}
            onRemove={() => onRemoveSet(set.key)}
          />
        ))}
      </ol>

      <Button
        variant="subtle"
        color="gray"
        fullWidth
        className="mt-1"
        leftSection={<IconSolarAddCircleBroken />}
        onClick={onAddSet}
      >
        Add set
      </Button>
    </li>
  );
};

export default ExerciseBlock;
