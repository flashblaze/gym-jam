import { ActionIcon, Badge, NumberInput } from "@mantine/core";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";

import type { Exercise, Segment } from "~/db/index";

interface SegmentRowProps {
  segment: Segment;
  exercises: Record<string, Exercise>;
  primaryExerciseId: string;
  onChange: (updated: Segment) => void;
  onRemove: () => void;
}

const SegmentRow = ({
  segment,
  exercises,
  primaryExerciseId,
  onChange,
  onRemove,
}: SegmentRowProps) => {
  const isSuperset = segment.exId !== primaryExerciseId;
  const isWeighted = (() => {
    const ex = exercises[segment.exId];
    return ex && (ex.type === "weighted" || ex.type === "assisted");
  })();

  return (
    <div className="mt-2 flex items-center gap-2 pl-10">
      <span className="text-sm text-[#565670]">{isSuperset ? "+" : "→"}</span>
      {isSuperset && (
        <span className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#7e7e96]">
          {exercises[segment.exId]?.name.split(" ").slice(0, 2).join(" ")}
        </span>
      )}
      {isWeighted && (
        <NumberInput
          size="xs"
          placeholder="kg"
          step={0.5}
          min={0}
          value={segment.w ?? ""}
          onChange={(v) => onChange({ ...segment, w: v === "" ? null : Number(v) })}
          className="w-16"
          styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
        />
      )}
      {isWeighted && <span className="text-xs text-[#565670]">×</span>}
      <NumberInput
        size="xs"
        placeholder="reps"
        min={0}
        value={segment.r ?? ""}
        onChange={(v) => onChange({ ...segment, r: v === "" ? 0 : Number(v) })}
        className="w-14"
        styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
      />
      <Badge size="xs" color={isSuperset ? "teal" : "violet"} variant="light">
        {isSuperset ? "SS" : "DS"}
      </Badge>
      <ActionIcon
        variant="default"
        color="gray"
        size="sm"
        onClick={onRemove}
        className="ml-auto"
        aria-label="Remove segment"
      >
        <IconSolarCloseCircleBroken />
      </ActionIcon>
    </div>
  );
};

export default SegmentRow;
