import { NumberInput } from "@mantine/core";

import type { Exercise, Segment } from "~/db/index";
import { needsWeight } from "~/lib/sets";

interface SegmentInputsProps {
  segment: Segment;
  type: Exercise["type"] | undefined;
  hint: Segment | undefined;
  onChange: (updated: Segment) => void;
}

const INPUT_CLASSNAMES = { input: "text-center font-mono" };

function parseInput(value: string | number): number | null {
  return value === "" ? null : Number(value);
}

const SegmentInputs = ({ segment, type, hint, onChange }: SegmentInputsProps) => {
  if (type === "timed") {
    const total = segment.r ?? 0;
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const hintTotal = hint?.r ?? null;

    return (
      <span className="flex items-center gap-1">
        <NumberInput
          size="md"
          hideControls
          inputMode="numeric"
          allowDecimal={false}
          allowNegative={false}
          aria-label="Minutes"
          placeholder={hintTotal ? String(Math.floor(hintTotal / 60)) : "min"}
          value={minutes || ""}
          onChange={(v) => onChange({ ...segment, r: (parseInput(v) ?? 0) * 60 + seconds })}
          className="w-14"
          classNames={INPUT_CLASSNAMES}
        />
        <span className="text-sm text-fg-faint">:</span>
        <NumberInput
          size="md"
          hideControls
          inputMode="numeric"
          allowDecimal={false}
          allowNegative={false}
          max={59}
          aria-label="Seconds"
          placeholder={hintTotal ? String(hintTotal % 60).padStart(2, "0") : "sec"}
          value={seconds || ""}
          onChange={(v) => onChange({ ...segment, r: minutes * 60 + (parseInput(v) ?? 0) })}
          className="w-14"
          classNames={INPUT_CLASSNAMES}
        />
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      {needsWeight(type) && (
        <>
          <NumberInput
            size="md"
            hideControls
            inputMode="decimal"
            allowNegative={false}
            aria-label="Weight (kg)"
            placeholder={hint?.w != null ? String(hint.w) : "kg"}
            value={segment.w ?? ""}
            onChange={(v) => onChange({ ...segment, w: parseInput(v) })}
            className="w-[4.5rem]"
            classNames={INPUT_CLASSNAMES}
          />
          <span className="text-sm text-fg-faint">×</span>
        </>
      )}
      <NumberInput
        size="md"
        hideControls
        inputMode="numeric"
        allowDecimal={false}
        allowNegative={false}
        aria-label="Reps"
        placeholder={hint?.r != null ? String(hint.r) : "reps"}
        value={segment.r ?? ""}
        onChange={(v) => onChange({ ...segment, r: parseInput(v) })}
        className="w-14"
        classNames={INPUT_CLASSNAMES}
      />
    </span>
  );
};

export default SegmentInputs;
