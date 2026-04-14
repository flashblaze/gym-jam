import { NumberInput } from "@mantine/core";

import type { Exercise, Segment, WorkoutSet } from "~/db/index";

import SegmentRow from "./SegmentRow";

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  primaryExerciseId: string;
  exercises: Record<string, Exercise>;
  onChange: (updated: WorkoutSet) => void;
  onRemove: () => void;
  onAddDrop: () => void;
  onAddSuperset: () => void;
}

const SetRow = ({
  set,
  index,
  primaryExerciseId,
  exercises,
  onChange,
  onRemove,
  onAddDrop,
  onAddSuperset,
}: SetRowProps) => {
  const primary = set[0];
  const isWeighted = (() => {
    const ex = exercises[primaryExerciseId];
    return ex && (ex.type === "weighted" || ex.type === "assisted");
  })();

  const updateSegment = (segIdx: number, updated: Segment) => {
    const next = [...set];
    next[segIdx] = updated;
    onChange(next);
  };

  const removeSegment = (segIdx: number) => {
    onChange(set.filter((_, i) => i !== segIdx));
  };

  return (
    <div className="rounded-xl border border-gray-200 px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="min-w-[34px] text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Set {index + 1}
        </span>
        {isWeighted && (
          <NumberInput
            size="sm"
            placeholder="kg"
            step={0.5}
            min={0}
            value={primary.w ?? ""}
            onChange={(v) => updateSegment(0, { ...primary, w: v === "" ? null : Number(v) })}
            className="w-20"
            styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
          />
        )}
        {isWeighted && <span className="text-sm text-gray-400">×</span>}
        <NumberInput
          size="sm"
          placeholder="reps"
          min={0}
          value={primary.r ?? ""}
          onChange={(v) => updateSegment(0, { ...primary, r: v === "" ? 0 : Number(v) })}
          className="w-16"
          styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-lg text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {set.slice(1).map((seg, i) => (
        <SegmentRow
          key={i}
          segment={seg}
          exercises={exercises}
          primaryExerciseId={primaryExerciseId}
          onChange={(updated) => updateSegment(i + 1, updated)}
          onRemove={() => removeSegment(i + 1)}
        />
      ))}

      <div className="mt-3 flex gap-2 pl-10">
        <button
          type="button"
          onClick={onAddDrop}
          className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-200"
        >
          + drop
        </button>
        <button
          type="button"
          onClick={onAddSuperset}
          className="rounded-full bg-teal-100 px-3 py-1 text-[10px] font-semibold text-teal-700 hover:bg-teal-200"
        >
          + superset
        </button>
      </div>
    </div>
  );
};

export default SetRow;
