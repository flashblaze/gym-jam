import { Badge } from "@mantine/core";

import type { Exercise, WorkoutSet } from "~/db/index";

interface SetRowProps {
  set: WorkoutSet;
  primaryExerciseId: string;
  index: number;
  exercises: Record<string, Exercise>;
}

const SetRow = ({ set, primaryExerciseId, index, exercises }: SetRowProps) => {
  const hasSuperset = set.slice(1).some((seg) => seg.exId !== primaryExerciseId);
  const isDropSet = set.length > 1 && !hasSuperset;

  const text = set
    .map((seg, j) => {
      const segEx = exercises[seg.exId];
      const prefix = j === 0 ? "" : seg.exId === primaryExerciseId ? " → " : " + ";
      const name =
        segEx && seg.exId !== primaryExerciseId
          ? segEx.name.split(" ").slice(0, 2).join(" ") + " "
          : "";
      const w = seg.w != null ? seg.w + "×" : "×";
      return prefix + name + w + seg.r;
    })
    .join("");

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3.5 text-gray-400">{index + 1}</span>
      <span className="flex-1 font-mono text-gray-600">{text}</span>
      {hasSuperset && (
        <Badge size="xs" color="teal" variant="light">
          SS
        </Badge>
      )}
      {isDropSet && (
        <Badge size="xs" color="violet" variant="light">
          DS
        </Badge>
      )}
    </div>
  );
};

export default SetRow;
