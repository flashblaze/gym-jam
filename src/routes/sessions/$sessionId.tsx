import { ActionIcon, Badge, Button, NumberInput, Skeleton, TextInput } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";
import IconSolarPenBroken from "~icons/solar/pen-broken";

import SessionStats from "~/components/sessions/SessionStats";
import type { Exercise, Segment, Session, WorkoutSet } from "~/db/index";
import { db } from "~/db/index";
import { useExercises } from "~/hooks/use-exercises";
import { useSession } from "~/hooks/use-sessions";
import { formatDate, formatDuration } from "~/lib/calc";

// Edit-mode set row
interface EditSetRowProps {
  set: WorkoutSet;
  setIndex: number;
  primaryExerciseId: string;
  exercises: Record<string, Exercise>;
  onChange: (updated: WorkoutSet) => void;
  onRemove: () => void;
}

const EditSetRow = ({
  set,
  setIndex,
  primaryExerciseId,
  exercises,
  onChange,
  onRemove,
}: EditSetRowProps) => {
  const updateSegment = (segIdx: number, updated: Segment) => {
    const next = set.map((s, i) => (i === segIdx ? updated : s));
    onChange(next);
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-gray-400">Set {setIndex + 1}</span>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onRemove}
          aria-label="Remove set"
        >
          <IconSolarCloseCircleBroken />
        </ActionIcon>
      </div>
      <div className="flex flex-col gap-1.5">
        {set.map((seg, segIdx) => {
          const isSuperset = seg.exId !== primaryExerciseId;
          const ex = exercises[seg.exId];
          const isTimed = ex?.type === "timed";
          const isWeighted = ex && (ex.type === "weighted" || ex.type === "assisted");
          const timedMin = Math.floor((seg.r ?? 0) / 60);
          const timedSec = (seg.r ?? 0) % 60;

          return (
            <div key={segIdx} className="flex items-center gap-2">
              {isSuperset && (
                <span className="max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-gray-500">
                  {ex?.name.split(" ").slice(0, 2).join(" ")}
                </span>
              )}
              {isTimed ? (
                <>
                  <NumberInput
                    size="xs"
                    placeholder="min"
                    min={0}
                    value={timedMin || ""}
                    onChange={(v) =>
                      updateSegment(segIdx, {
                        ...seg,
                        r: (v === "" ? 0 : Number(v)) * 60 + timedSec,
                      })
                    }
                    className="w-14"
                    styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
                  />
                  <span className="text-xs text-gray-400">m</span>
                  <NumberInput
                    size="xs"
                    placeholder="sec"
                    min={0}
                    max={59}
                    value={timedSec || ""}
                    onChange={(v) =>
                      updateSegment(segIdx, {
                        ...seg,
                        r: timedMin * 60 + (v === "" ? 0 : Number(v)),
                      })
                    }
                    className="w-14"
                    styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
                  />
                  <span className="text-xs text-gray-400">s</span>
                </>
              ) : (
                <>
                  {isWeighted && (
                    <NumberInput
                      size="xs"
                      placeholder="kg"
                      step={0.5}
                      min={0}
                      value={seg.w ?? ""}
                      onChange={(v) =>
                        updateSegment(segIdx, { ...seg, w: v === "" ? null : Number(v) })
                      }
                      className="w-16"
                      styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
                    />
                  )}
                  {isWeighted && <span className="text-xs text-gray-400">×</span>}
                  <NumberInput
                    size="xs"
                    placeholder="reps"
                    min={0}
                    value={seg.r ?? ""}
                    onChange={(v) => updateSegment(segIdx, { ...seg, r: v === "" ? 0 : Number(v) })}
                    className="w-14"
                    styles={{ input: { textAlign: "center", fontFamily: "monospace" } }}
                  />
                </>
              )}
              {isSuperset && (
                <Badge size="xs" color="teal" variant="light">
                  SS
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Read-only set row (view mode)
interface ViewSetRowProps {
  set: WorkoutSet;
  index: number;
  primaryExerciseId: string;
  exercises: Record<string, Exercise>;
}

const ViewSetRow = ({ set, index, primaryExerciseId, exercises }: ViewSetRowProps) => {
  const primaryEx = exercises[primaryExerciseId];
  const isTimed = primaryEx?.type === "timed";
  const hasSuperset = set.slice(1).some((seg) => seg.exId !== primaryExerciseId);
  const isDropSet = set.length > 1 && !hasSuperset;

  const text = isTimed
    ? set.map((seg) => formatDuration(seg.r)).join(" → ")
    : set
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

const SessionDetailPage = () => {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession(sessionId);
  const exercisesArr = useExercises();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Session | null>(null);

  const exercises: Record<string, Exercise> =
    exercisesArr?.reduce(
      (acc, ex) => {
        acc[ex.id] = ex;
        return acc;
      },
      {} as Record<string, Exercise>,
    ) ?? {};

  if (session === undefined || exercisesArr === undefined) {
    return (
      <div className="px-4 py-5">
        <Skeleton height={28} width={120} mb={8} />
        <Skeleton height={24} width={200} mb={4} />
        <Skeleton height={96} radius="xl" mt={16} />
        <Skeleton height={64} radius="xl" mt={8} />
        <Skeleton height={64} radius="xl" mt={8} />
      </div>
    );
  }

  if (!session) {
    void navigate({ to: "/sessions" });
    return null;
  }

  const startEdit = () => {
    setDraft(structuredClone(session));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!draft) return;
    // Remove exercises with no sets
    const cleaned = { ...draft, exercises: draft.exercises.filter((e) => e.sets.length > 0) };
    await db.sessions.put(cleaned);
    setDraft(null);
    setEditing(false);
  };

  const updateDraftSet = (exIdx: number, setIdx: number, updated: WorkoutSet) => {
    if (!draft) return;
    const exercises = draft.exercises.map((e, i) => {
      if (i !== exIdx) return e;
      return { ...e, sets: e.sets.map((s, j) => (j === setIdx ? updated : s)) };
    });
    setDraft({ ...draft, exercises });
  };

  const removeDraftSet = (exIdx: number, setIdx: number) => {
    if (!draft) return;
    const exercises = draft.exercises.map((e, i) => {
      if (i !== exIdx) return e;
      return { ...e, sets: e.sets.filter((_, j) => j !== setIdx) };
    });
    setDraft({ ...draft, exercises });
  };

  const removeDraftExercise = (exIdx: number) => {
    if (!draft) return;
    setDraft({ ...draft, exercises: draft.exercises.filter((_, i) => i !== exIdx) });
  };

  const displayed = editing && draft ? draft : session;

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <Button
            variant="subtle"
            size="compact-sm"
            color="gray"
            leftSection={<IconSolarAltArrowLeftBroken />}
            onClick={() => void navigate({ to: "/sessions" })}
          >
            Back
          </Button>
          {!editing && (
            <Button
              variant="subtle"
              size="compact-sm"
              color="gray"
              leftSection={<IconSolarPenBroken />}
              onClick={startEdit}
            >
              Edit
            </Button>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{formatDate(displayed.date)}</h1>
        {editing && draft ? (
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
            size="xs"
            className="mt-1 max-w-[220px]"
          />
        ) : (
          <p className="mt-0.5 text-sm text-gray-500">{displayed.name}</p>
        )}
      </div>

      <SessionStats session={displayed} />

      <div className="flex flex-col gap-2 px-4 pt-2">
        {displayed.exercises.map((entry, exIdx) => {
          const ex = exercises[entry.exerciseId];
          if (!ex) return null;

          return (
            <div key={entry.exerciseId} className="rounded-xl border border-gray-200 px-4 py-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-900">{ex.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{entry.sets.length} sets</span>
                  {editing && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeDraftExercise(exIdx)}
                      aria-label="Remove exercise"
                    >
                      <IconSolarCloseCircleBroken />
                    </ActionIcon>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {entry.sets.map((set, setIdx) =>
                  editing ? (
                    <EditSetRow
                      key={setIdx}
                      set={set}
                      setIndex={setIdx}
                      primaryExerciseId={entry.exerciseId}
                      exercises={exercises}
                      onChange={(updated) => updateDraftSet(exIdx, setIdx, updated)}
                      onRemove={() => removeDraftSet(exIdx, setIdx)}
                    />
                  ) : (
                    <ViewSetRow
                      key={setIdx}
                      set={set}
                      index={setIdx}
                      primaryExerciseId={entry.exerciseId}
                      exercises={exercises}
                    />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="mt-4 flex gap-2 px-4">
          <Button variant="outline" color="gray" size="sm" onClick={cancelEdit} className="flex-1">
            Cancel
          </Button>
          <Button size="sm" onClick={() => void saveEdit()} className="flex-1">
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailPage,
});
