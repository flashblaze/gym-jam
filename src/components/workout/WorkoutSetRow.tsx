import { ActionIcon, Menu } from "@mantine/core";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";
import IconSolarMenuDotsBold from "~icons/solar/menu-dots-bold";
import IconTablerCheck from "~icons/tabler/check";

import { cn } from "~/cn";
import type { Exercise, Segment } from "~/db/index";
import { removeAt, replaceAt, shortExerciseName } from "~/lib/sets";
import { type DraftSet, type PreviousPerformance, hintFor } from "~/lib/workout";

import SegmentInputs from "./SegmentInputs";

interface WorkoutSetRowProps {
  set: DraftSet;
  index: number;
  primaryExerciseId: string;
  exercises: Record<string, Exercise>;
  previous: PreviousPerformance | undefined;
  onChangeSegments: (segments: Segment[]) => void;
  onToggleDone: () => void;
  onAddDrop: () => void;
  onAddSuperset: () => void;
  onRemove: () => void;
}

const WorkoutSetRow = ({
  set,
  index,
  primaryExerciseId,
  exercises,
  previous,
  onChangeSegments,
  onToggleDone,
  onAddDrop,
  onAddSuperset,
  onRemove,
}: WorkoutSetRowProps) => {
  const primaryType = exercises[primaryExerciseId]?.type;
  const isTimed = primaryType === "timed";
  const [primary, ...extras] = set.segments;

  const updateSegment = (segIdx: number, updated: Segment) => {
    onChangeSegments(replaceAt(set.segments, segIdx, updated));
  };

  return (
    <li className="border-t border-line py-1.5">
      <div className="flex items-center gap-2">
        <span className="w-7 font-display text-lg font-bold tabular-nums text-fg-faint">
          {String(index + 1).padStart(2, "0")}
        </span>
        <SegmentInputs
          segment={primary}
          type={primaryType}
          done={set.done}
          hint={hintFor(previous, index, 0, primary.exId)}
          onChange={(updated) => updateSegment(0, updated)}
        />
        <ActionIcon
          size="xl"
          variant={set.done ? "filled" : "default"}
          onClick={onToggleDone}
          aria-label={set.done ? `Mark set ${index + 1} not done` : `Mark set ${index + 1} done`}
          aria-pressed={set.done}
          className={cn("ml-auto", set.done && "motion-safe:animate-pop")}
        >
          <IconTablerCheck className="text-2xl" />
        </ActionIcon>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon
              size="lg"
              variant="subtle"
              color="gray"
              aria-label={`Set ${index + 1} options`}
            >
              <IconSolarMenuDotsBold className="text-lg" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {!isTimed && <Menu.Item onClick={onAddDrop}>Add drop set</Menu.Item>}
            {!isTimed && <Menu.Item onClick={onAddSuperset}>Superset with…</Menu.Item>}
            <Menu.Item color="red" onClick={onRemove}>
              Delete set
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      {extras.map((seg, i) => {
        const segIdx = i + 1;
        const isDrop = seg.exId === primaryExerciseId;
        const label = isDrop ? "Drop" : shortExerciseName(exercises[seg.exId]);
        return (
          <div key={segIdx} className="mt-2 flex items-center gap-2">
            <span className="w-7 text-center font-display text-lg font-bold text-fg-faint">
              {isDrop ? "↓" : "+"}
            </span>
            <SegmentInputs
              segment={seg}
              type={exercises[seg.exId]?.type}
              done={set.done}
              hint={hintFor(previous, index, segIdx, seg.exId)}
              onChange={(updated) => updateSegment(segIdx, updated)}
            />
            <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.08em] text-fg-subtle">
              {label}
            </span>
            <ActionIcon
              size="lg"
              variant="subtle"
              color="gray"
              onClick={() => onChangeSegments(removeAt(set.segments, segIdx))}
              aria-label={`Remove ${isDrop ? "drop" : label} from set ${index + 1}`}
            >
              <IconSolarCloseCircleBroken className="text-lg" />
            </ActionIcon>
          </div>
        );
      })}
    </li>
  );
};

export default WorkoutSetRow;
