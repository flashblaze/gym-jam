import { ActionIcon, Badge, Button, Skeleton, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";
import IconSolarCloseCircleBroken from "~icons/solar/close-circle-broken";
import IconSolarPenBroken from "~icons/solar/pen-broken";
import IconSolarTrashBinMinimalisticBroken from "~icons/solar/trash-bin-minimalistic-broken";

import SetRow from "~/components/log/SetRow";
import SupersetPicker from "~/components/log/SupersetPicker";
import SessionStats from "~/components/sessions/SessionStats";
import type { Exercise, Session, WorkoutSet } from "~/db/index";
import { db } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises } from "~/hooks/use-exercises";
import { useSession } from "~/hooks/use-sessions";
import { formatDate, formatDuration } from "~/lib/calc";

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
    ? set.map((seg) => formatDuration(seg.r ?? 0)).join(" → ")
    : set
        .map((seg, j) => {
          const segEx = exercises[seg.exId];
          const prefix = j === 0 ? "" : seg.exId === primaryExerciseId ? " → " : " + ";
          const name =
            segEx && seg.exId !== primaryExerciseId
              ? segEx.name.split(" ").slice(0, 2).join(" ") + " "
              : "";
          const w = seg.w != null ? seg.w + "×" : "×";
          const rDisp = seg.r == null ? "—" : String(seg.r);
          return prefix + name + w + rDisp;
        })
        .join("");

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3.5 text-[#565670]">{index + 1}</span>
      <span className="flex-1 font-mono text-[#a0a0b8]">{text}</span>
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
  const categories = useCategories();
  const [pickerOpened, { open: openPicker, close: closePicker }] = useDisclosure(false);
  const [pickerTarget, setPickerTarget] = useState<{ exIdx: number; setIdx: number } | null>(null);

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

  const draftExerciseIds = useMemo(() => {
    if (!draft) return new Set<string>();
    const ids = new Set<string>();
    for (const e of draft.exercises) {
      for (const st of e.sets) {
        for (const seg of st) ids.add(seg.exId);
      }
    }
    return ids;
  }, [draft]);

  if (session === undefined || exercisesArr === undefined || categories === undefined) {
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

  const deleteSession = () => {
    modals.openConfirmModal({
      title: "Delete session",
      children: (
        <p className="text-sm text-[#a0a0b8]">
          Delete the session from {formatDate(session.date)}? This cannot be undone.
        </p>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        void db.sessions.delete(session.id).then(() => {
          void navigate({ to: "/sessions" });
        });
      },
    });
  };

  const startEdit = () => {
    setDraft(structuredClone(session));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
    setPickerTarget(null);
    closePicker();
  };

  const saveEdit = async () => {
    if (!draft) return;
    const invalid = draft.exercises.some((e) =>
      e.sets.some((set) =>
        set.some((seg) => {
          const ex = exercises[seg.exId];
          if (!ex) return true;
          if (ex.type === "timed") return (seg.r ?? 0) <= 0;
          const needsWeight = ex.type === "weighted" || ex.type === "assisted";
          if (needsWeight && seg.w == null) return true;
          return seg.r == null || seg.r <= 0;
        }),
      ),
    );
    if (invalid) {
      notifications.show({
        title: "Incomplete sets",
        message: "Fill in weight, reps, or duration for every segment before saving.",
        color: "red",
      });
      return;
    }
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

  const addDraftSet = (exIdx: number) => {
    if (!draft) return;
    const entry = draft.exercises[exIdx];
    const last = entry.sets[entry.sets.length - 1];
    const primaryW = last?.[0].w ?? null;
    const ex = exercises[entry.exerciseId];
    const initialR = ex?.type === "timed" ? 0 : null;
    const newSet: WorkoutSet = [{ exId: entry.exerciseId, w: primaryW, r: initialR }];
    const nextExercises = draft.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, newSet] } : e,
    );
    setDraft({ ...draft, exercises: nextExercises });
  };

  const addDraftDrop = (exIdx: number, setIdx: number) => {
    if (!draft) return;
    const entry = draft.exercises[exIdx];
    const st = entry.sets[setIdx];
    const primary = st[0];
    const ex = exercises[entry.exerciseId];
    const initialR = ex?.type === "timed" ? 0 : null;
    updateDraftSet(exIdx, setIdx, [...st, { exId: entry.exerciseId, w: primary.w, r: initialR }]);
  };

  const openSupersetPicker = (exIdx: number, setIdx: number) => {
    setPickerTarget({ exIdx, setIdx });
    openPicker();
  };

  const addSuperset = (partnerExId: string) => {
    if (!draft || !pickerTarget) return;
    const { exIdx, setIdx } = pickerTarget;
    const entry = draft.exercises[exIdx];
    const st = entry.sets[setIdx];
    const partnerEx = exercises[partnerExId];
    const initialR = partnerEx?.type === "timed" ? 0 : null;
    updateDraftSet(exIdx, setIdx, [...st, { exId: partnerExId, w: null, r: initialR }]);
    setPickerTarget(null);
  };

  const displayed = editing && draft ? draft : session;

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <Button
            variant="default"
            size="compact-sm"
            leftSection={<IconSolarAltArrowLeftBroken />}
            onClick={() => void navigate({ to: "/sessions" })}
          >
            Back
          </Button>
          {!editing && (
            <div className="flex items-center gap-1">
              <ActionIcon
                variant="transparent"
                size="sm"
                onClick={deleteSession}
                aria-label="Delete session"
              >
                <IconSolarTrashBinMinimalisticBroken className="text-red-400/60" />
              </ActionIcon>
              <Button
                variant="default"
                size="compact-sm"
                leftSection={<IconSolarPenBroken />}
                onClick={startEdit}
              >
                Edit
              </Button>
            </div>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#d4d4e0]">
          {formatDate(displayed.date)}
        </h1>
        {editing && draft ? (
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
            size="md"
            className="mt-1 max-w-[220px]"
          />
        ) : (
          <p className="mt-0.5 text-xs text-[#565670]">{displayed.name}</p>
        )}
      </div>

      <SessionStats session={displayed} />

      <div className="flex flex-col gap-2 px-4 pt-2">
        {displayed.exercises.map((entry, exIdx) => {
          const ex = exercises[entry.exerciseId];
          if (!ex) return null;

          return (
            <div
              key={entry.exerciseId}
              className="rounded-xl border border-white/8 bg-[#18182a] px-4 py-3"
            >
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[#d4d4e0]">{ex.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#565670]">{entry.sets.length} sets</span>
                  {editing && (
                    <ActionIcon
                      variant="transparent"
                      size="sm"
                      onClick={() => removeDraftExercise(exIdx)}
                      aria-label="Remove exercise"
                    >
                      <IconSolarCloseCircleBroken className="text-red-400/60" />
                    </ActionIcon>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {entry.sets.map((set, setIdx) =>
                  editing ? (
                    <SetRow
                      key={setIdx}
                      set={set}
                      index={setIdx}
                      primaryExerciseId={entry.exerciseId}
                      exercises={exercises}
                      onChange={(updated) => updateDraftSet(exIdx, setIdx, updated)}
                      onRemove={() => removeDraftSet(exIdx, setIdx)}
                      onAddDrop={() => addDraftDrop(exIdx, setIdx)}
                      onAddSuperset={() => openSupersetPicker(exIdx, setIdx)}
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
                {editing && (
                  <Button
                    variant="default"
                    fullWidth
                    className="mt-1 border-dashed"
                    size="sm"
                    onClick={() => addDraftSet(exIdx)}
                  >
                    + Add set
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="mt-4 flex gap-2 px-4">
          <Button variant="default" size="sm" onClick={cancelEdit} className="flex-1">
            Cancel
          </Button>
          <Button size="sm" onClick={() => void saveEdit()} className="flex-1">
            Save
          </Button>
        </div>
      )}

      {editing && draft && (
        <SupersetPicker
          opened={pickerOpened}
          onClose={() => {
            setPickerTarget(null);
            closePicker();
          }}
          onPick={addSuperset}
          exercises={exercisesArr}
          categories={categories}
          currentDraftExerciseIds={draftExerciseIds}
          primaryExerciseId={pickerTarget ? draft.exercises[pickerTarget.exIdx].exerciseId : ""}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailPage,
});
