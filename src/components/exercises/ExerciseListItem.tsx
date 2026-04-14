import { UnstyledButton } from "@mantine/core";
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
    <UnstyledButton
      onClick={() =>
        void navigate({ to: "/exercises/$exerciseId", params: { exerciseId: exercise.id } })
      }
      className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#18182a] px-4 py-3 transition-colors hover:border-white/[0.14] hover:bg-[#1e1e32]"
    >
      <span className="text-sm font-medium text-[#d4d4e0]">{exercise.name}</span>
      <span className="text-xs text-[#565670]">
        {lastSessionDate ? formatDate(lastSessionDate) : "—"}
      </span>
    </UnstyledButton>
  );
};

export default ExerciseListItem;
