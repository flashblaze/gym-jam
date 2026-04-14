import { useNavigate } from "@tanstack/react-router";

import type { Exercise, SessionExercise } from "~/db/index";

import SetRow from "./SetRow";

interface ExerciseCardProps {
  entry: SessionExercise;
  exercises: Record<string, Exercise>;
}

const ExerciseCard = ({ entry, exercises }: ExerciseCardProps) => {
  const navigate = useNavigate();
  const ex = exercises[entry.exerciseId];
  if (!ex) return null;

  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: "/exercises/$exerciseId", params: { exerciseId: ex.id } })}
          className="text-sm font-semibold text-gray-900 hover:underline"
        >
          {ex.name}
        </button>
        <span className="text-xs text-gray-400">{entry.sets.length} sets</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {entry.sets.map((set, i) => (
          <SetRow
            key={i}
            set={set}
            primaryExerciseId={entry.exerciseId}
            index={i}
            exercises={exercises}
          />
        ))}
      </div>
    </div>
  );
};

export default ExerciseCard;
