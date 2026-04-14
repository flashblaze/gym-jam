import { useNavigate } from "@tanstack/react-router";

import type { Exercise } from "~/db/index";
import { formatDate } from "~/lib/calc";

interface ExerciseListItemProps {
  exercise: Exercise;
  lastSessionDate: string | undefined;
}

const ExerciseListItem = ({ exercise, lastSessionDate }: ExerciseListItemProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate({ to: "/exercises/$exerciseId", params: { exerciseId: exercise.id } })
      }
      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <span className="text-sm font-medium text-gray-900">{exercise.name}</span>
      <span className="text-xs text-gray-400">
        {lastSessionDate ? formatDate(lastSessionDate) : "—"}
      </span>
    </button>
  );
};

export default ExerciseListItem;
