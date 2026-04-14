import { ActionIcon, Button, NumberInput } from "@mantine/core";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";

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
  const ex = exercises[primaryExerciseId];
  const isTimed = ex?.type === "timed";
  const isWeighted = ex && (ex.type === "weighted" || ex.type === "assisted");

  const updateSegment = (segIdx: number, updated: Segment) => {
    const next = [...set];
    next[segIdx] = updated;
    onChange(next);
  };

  const removeSegment = (segIdx: number) => {
    onChange(set.filter((_, i) => i !== segIdx));
  };

  const timedMinutes = Math.floor((primary.r ?? 0) / 60);
  const timedSeconds = (primary.r ?? 0) % 60;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#18182a] px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="min-w-[34px] text-[10px] font-medium uppercase tracking-widest text-[#565670]">
          S{index + 1}
        </span>

        {isTimed ? (
          <>
            <NumberInput
              size="sm"
              placeholder="min"
              min={0}
              value={timedMinutes || ""}
              onChange={(v) =>
                updateSegment(0, { ...primary, r: (v === "" ? 0 : Number(v)) * 60 + timedSeconds })
              }
              className="w-16"
              styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
            />
            <span className="text-sm text-[#565670]">m</span>
            <NumberInput
              size="sm"
              placeholder="sec"
              min={0}
              max={59}
              value={timedSeconds || ""}
              onChange={(v) =>
                updateSegment(0, {
                  ...primary,
                  r: timedMinutes * 60 + (v === "" ? 0 : Number(v)),
                })
              }
              className="w-16"
              styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
            />
            <span className="text-sm text-[#565670]">s</span>
          </>
        ) : (
          <>
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
            {isWeighted && <span className="text-sm text-[#565670]">×</span>}
            <NumberInput
              size="sm"
              placeholder="reps"
              min={0}
              value={primary.r ?? ""}
              onChange={(v) => updateSegment(0, { ...primary, r: v === "" ? 0 : Number(v) })}
              className="w-16"
              styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
            />
          </>
        )}

        <ActionIcon
          variant="default"
          color="gray"
          size="sm"
          onClick={onRemove}
          className="ml-auto"
          aria-label="Remove set"
        >
          <IconSolarCloseCircleBroken />
        </ActionIcon>
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

      {!isTimed && (
        <div className="mt-3 flex gap-2 pl-10">
          <Button size="xs" variant="filled" color="violet" radius="xl" onClick={onAddDrop}>
            + Drop
          </Button>
          <Button size="xs" variant="filled" color="teal" radius="xl" onClick={onAddSuperset}>
            + Superset
          </Button>
        </div>
      )}
    </div>
  );
};

export default SetRow;
