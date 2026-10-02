import { Button, UnstyledButton } from "@mantine/core";

import type { Exercise } from "~/db/index";
import type { SimilarExercises } from "~/lib/exercise-names";

interface ExerciseNameHintsProps {
  similar: SimilarExercises;
  /** Offered as "Use this" when picking an existing exercise makes sense (e.g. in a workout). */
  onUseExisting?: (exercise: Exercise) => void;
}

/** Warnings under the exercise name field. Exact duplicates are reported as the field's error. */
const ExerciseNameHints = ({ similar, onUseExisting }: ExerciseNameHintsProps) => {
  const { same, related } = similar;
  if (same.length === 0 && related.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 text-sm" aria-live="polite">
      {same.map((exercise) => (
        <p
          key={exercise.id}
          className="flex items-center justify-between gap-3 border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-fg"
        >
          <span>
            Probably the same as <strong>{exercise.name}</strong>
          </span>
          {onUseExisting && (
            <Button size="compact-sm" variant="light" onClick={() => onUseExisting(exercise)}>
              Use this
            </Button>
          )}
        </p>
      ))}
      {related.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
          <span className="font-bold uppercase tracking-[0.1em]">Related:</span>
          {related.map((exercise, i) =>
            onUseExisting ? (
              <UnstyledButton
                key={exercise.id}
                onClick={() => onUseExisting(exercise)}
                className="text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
              >
                {exercise.name}
              </UnstyledButton>
            ) : (
              <span key={exercise.id} className="text-fg-muted">
                {exercise.name}
                {i < related.length - 1 && ","}
              </span>
            ),
          )}
        </p>
      )}
    </div>
  );
};

export default ExerciseNameHints;
