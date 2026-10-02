import { Button, Skeleton } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconTablerCheck from "~icons/tabler/check";

import EmptyState from "~/components/EmptyState";
import CreateExerciseDrawer from "~/components/exercises/CreateExerciseDrawer";
import ExerciseBlock from "~/components/workout/ExerciseBlock";
import ExercisePickerDrawer, { type PinnedGroup } from "~/components/workout/ExercisePickerDrawer";
import RestTimer from "~/components/workout/RestTimer";
import WorkoutHeader from "~/components/workout/WorkoutHeader";
import { deleteSessions } from "~/db/delete-sessions";
import { type Category, type Exercise, type Session, db } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises, useExercisesById } from "~/hooks/use-exercises";
import { usePreferences } from "~/hooks/use-preferences";
import { useSessions } from "~/hooks/use-sessions";
import { useWorkoutPersistence } from "~/hooks/use-workout-persistence";
import { formatVolume, isLoggableDate, nanoid, pluralize, sessVolume, todayIso } from "~/lib/calc";
import { haptic } from "~/lib/haptics";
import { appendDrop, appendSuperset, insertAt, isSetComplete, removeAt } from "~/lib/sets";
import {
  type WorkoutDraft,
  appendDraftSet,
  countUnfinishedSets,
  discardUnfinished,
  fillFromHint,
  hintFor,
  newBlock,
  previousPerformances,
  recentExerciseIds,
  resolveDraft,
  sessionKey,
  toSession,
  updateBlock,
  updateDraftSet,
  withSegments,
} from "~/lib/workout";
import { loadDraft, pruneOldDrafts } from "~/lib/workout-draft-storage";

const RECENT_LIMIT = 8;

type PickerTarget = { mode: "add" } | { mode: "superset"; blockKey: string; setKey: string };

function showUndo(title: string, onUndo: () => void) {
  const id = nanoid("undo-");
  notifications.show({
    id,
    title,
    message: (
      <Button
        size="compact-sm"
        variant="light"
        onClick={() => {
          onUndo();
          notifications.hide(id);
        }}
      >
        Undo
      </Button>
    ),
  });
}

interface WorkoutEditorProps {
  date: string;
  stored: Session | null;
  exercisesById: Record<string, Exercise>;
  exerciseList: Exercise[];
  categories: Category[];
  sessions: Session[];
}

const WorkoutEditor = ({
  date,
  stored,
  exercisesById,
  exerciseList,
  categories,
  sessions,
}: WorkoutEditorProps) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<WorkoutDraft>(() =>
    resolveDraft(stored, loadDraft(date), date, exercisesById),
  );
  const { dispose, status } = useWorkoutPersistence(draft, sessionKey(stored));
  const [finishing, setFinishing] = useState(false);
  // Bumped on every completed set; 0 hides the rest timer.
  const [restRun, setRestRun] = useState(0);
  const [preferences] = usePreferences();
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [createName, setCreateName] = useState<string | null>(null);

  const previous = useMemo(() => previousPerformances(sessions, date), [sessions, date]);
  const recentIds = useMemo(() => recentExerciseIds(sessions, RECENT_LIMIT), [sessions]);

  const persisted = toSession(draft);
  const doneSets = persisted.exercises.reduce((n, block) => n + block.sets.length, 0);
  const summary =
    doneSets === 0
      ? draft.blocks.length > 0
        ? "Tick ✓ on a set to save it"
        : "Nothing logged yet"
      : [
          pluralize(persisted.exercises.length, "exercise"),
          pluralize(doneSets, "set"),
          formatVolume(sessVolume(persisted)),
        ].join(" · ");

  // Runs after the persistence hook has stored the trimmed draft for this render.
  useEffect(() => {
    if (!finishing) return;
    notifications.show({
      title: "Workout saved",
      message: `${pluralize(doneSets, "set")} logged.`,
      color: "green",
    });
    void navigate({ to: "/sessions" });
  }, [finishing, doneSets, navigate]);

  const finishWorkout = () => {
    const finish = () => {
      setDraft(discardUnfinished);
      setFinishing(true);
    };
    const unfinished = countUnfinishedSets(draft);
    if (unfinished === 0) {
      finish();
      return;
    }
    modals.openConfirmModal({
      title: "Finish workout",
      children: (
        <p className="text-sm text-fg-muted">
          {pluralize(unfinished, "set")} {unfinished === 1 ? "isn't" : "aren't"} ticked and
          won&apos;t be saved.
        </p>
      ),
      labels: { confirm: "Finish anyway", cancel: "Keep logging" },
      onConfirm: finish,
    });
  };

  const workoutExerciseIds = new Set(draft.blocks.map((block) => block.exerciseId));

  const typeOf = (exId: string) => exercisesById[exId]?.type;

  const addExercise = (exerciseId: string) => {
    setDraft((d) => ({
      ...d,
      blocks: [...d.blocks, newBlock(exerciseId, typeOf(exerciseId), previous[exerciseId])],
    }));
  };

  const pick = (exerciseId: string) => {
    if (picker?.mode === "superset") {
      const { blockKey, setKey } = picker;
      setDraft((d) =>
        updateDraftSet(d, blockKey, setKey, (set) =>
          withSegments(
            set,
            appendSuperset(set.segments, exerciseId, typeOf(exerciseId)),
            exercisesById,
          ),
        ),
      );
    } else {
      addExercise(exerciseId);
    }
    setPicker(null);
  };

  const toggleDone = (blockKey: string, setKey: string, setIndex: number) => {
    const block = draft.blocks.find((b) => b.key === blockKey);
    const set = block?.sets.find((s) => s.key === setKey);
    if (!block || !set) return;

    if (set.done) {
      setDraft((d) => updateDraftSet(d, blockKey, setKey, (s) => ({ ...s, done: false })));
      return;
    }

    const filled = set.segments.map((seg, segIdx) =>
      fillFromHint(
        seg,
        hintFor(previous[block.exerciseId], setIndex, segIdx, seg.exId),
        typeOf(seg.exId),
      ),
    );
    if (!isSetComplete(filled, exercisesById)) {
      notifications.show({
        title: "Incomplete set",
        message:
          typeOf(block.exerciseId) === "timed"
            ? "Enter a duration first."
            : "Enter weight and reps for every part of the set.",
        color: "red",
      });
      return;
    }
    setDraft((d) =>
      updateDraftSet(d, blockKey, setKey, (s) => ({ ...s, segments: filled, done: true })),
    );
    if (preferences.restTimerEnabled) setRestRun((n) => n + 1);
    haptic();
  };

  const removeSet = (blockKey: string, setKey: string) => {
    const block = draft.blocks.find((b) => b.key === blockKey);
    const index = block?.sets.findIndex((s) => s.key === setKey) ?? -1;
    if (!block || index < 0) return;
    const removed = block.sets[index];
    setDraft((d) => updateBlock(d, blockKey, (b) => ({ ...b, sets: removeAt(b.sets, index) })));
    showUndo("Set deleted", () =>
      setDraft((d) =>
        updateBlock(d, blockKey, (b) => ({ ...b, sets: insertAt(b.sets, index, removed) })),
      ),
    );
  };

  const removeBlock = (blockKey: string) => {
    const index = draft.blocks.findIndex((b) => b.key === blockKey);
    if (index < 0) return;
    const removed = draft.blocks[index];
    setDraft((d) => ({ ...d, blocks: removeAt(d.blocks, index) }));
    showUndo("Exercise removed", () =>
      setDraft((d) => ({ ...d, blocks: insertAt(d.blocks, index, removed) })),
    );
  };

  const deleteWorkout = () => {
    modals.openConfirmModal({
      title: "Delete workout",
      children: (
        <p className="text-sm text-fg-muted">
          Delete this workout and all {pluralize(doneSets, "logged set")}? This cannot be undone.
        </p>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        dispose();
        void deleteSessions([persisted])
          .then(() => navigate({ to: "/sessions" }))
          .catch((err: unknown) =>
            notifications.show({
              title: "Delete failed",
              message: err instanceof Error ? err.message : "Could not delete the workout.",
              color: "red",
            }),
          );
      },
    });
  };

  const pinned: PinnedGroup[] =
    picker?.mode === "superset"
      ? [{ label: "In this workout", ids: [...workoutExerciseIds] }]
      : [{ label: "Recent", ids: recentIds }];
  const supersetPrimaryId =
    picker?.mode === "superset"
      ? draft.blocks.find((b) => b.key === picker.blockKey)?.exerciseId
      : undefined;
  const pickerExclude: ReadonlySet<string> =
    picker?.mode === "superset"
      ? new Set(supersetPrimaryId ? [supersetPrimaryId] : [])
      : workoutExerciseIds;

  let content: ReactNode;
  if (draft.blocks.length === 0) {
    content = (
      <EmptyState message="Add your first exercise to start logging. Tick ✓ on a set to save it." />
    );
  } else {
    content = (
      <ol className="flex flex-col gap-3 px-4">
        {draft.blocks.map((block) => (
          <ExerciseBlock
            key={block.key}
            block={block}
            exercises={exercisesById}
            previous={previous[block.exerciseId]}
            onChangeSegments={(setKey, segments) =>
              setDraft((d) =>
                updateDraftSet(d, block.key, setKey, (set) =>
                  withSegments(set, segments, exercisesById),
                ),
              )
            }
            onToggleDone={(setKey, setIndex) => toggleDone(block.key, setKey, setIndex)}
            onAddSet={() =>
              setDraft((d) =>
                updateBlock(d, block.key, (b) => appendDraftSet(b, typeOf(b.exerciseId))),
              )
            }
            onAddDrop={(setKey) =>
              setDraft((d) =>
                updateDraftSet(d, block.key, setKey, (set) =>
                  withSegments(
                    set,
                    appendDrop(set.segments, typeOf(block.exerciseId)),
                    exercisesById,
                  ),
                ),
              )
            }
            onAddSuperset={(setKey) => setPicker({ mode: "superset", blockKey: block.key, setKey })}
            onRemoveSet={(setKey) => removeSet(block.key, setKey)}
            onRemove={() => removeBlock(block.key)}
          />
        ))}
      </ol>
    );
  }

  return (
    <div className="pb-6">
      <WorkoutHeader
        date={date}
        name={draft.name}
        summary={summary}
        saveStatus={doneSets > 0 || status !== "saved" ? status : null}
        canDelete={draft.blocks.length > 0}
        onNameChange={(name) => setDraft((d) => ({ ...d, name }))}
        onDateChange={(next) => void navigate({ to: "/workout/$date", params: { date: next } })}
        onDelete={deleteWorkout}
      />

      {content}

      <div className="mt-3 px-4">
        <Button
          fullWidth
          size="md"
          variant={draft.blocks.length === 0 ? "filled" : "light"}
          leftSection={<IconSolarAddCircleBroken />}
          onClick={() => setPicker({ mode: "add" })}
        >
          Add exercise
        </Button>
        {doneSets > 0 && (
          <Button
            fullWidth
            size="md"
            className="mt-2"
            leftSection={<IconTablerCheck />}
            onClick={finishWorkout}
          >
            Finish workout
          </Button>
        )}
      </div>

      {preferences.restTimerEnabled && restRun > 0 && (
        <RestTimer
          key={restRun}
          targetSeconds={preferences.restSeconds}
          onDismiss={() => setRestRun(0)}
        />
      )}

      <ExercisePickerDrawer
        opened={picker !== null}
        title={picker?.mode === "superset" ? "Superset with…" : "Add exercise"}
        exercises={exerciseList}
        categories={categories}
        pinned={pinned}
        excludeIds={pickerExclude}
        onClose={() => setPicker(null)}
        onPick={pick}
        onCreate={(name) => {
          setPicker(null);
          setCreateName(name);
        }}
      />

      <CreateExerciseDrawer
        opened={createName !== null}
        onClose={() => setCreateName(null)}
        categories={categories}
        initialName={createName ?? ""}
        onCreated={(exercise) => addExercise(exercise.id)}
      />
    </div>
  );
};

const WorkoutSkeleton = () => (
  <div className="px-4 py-5">
    <Skeleton height={32} width={160} mb={8} />
    <Skeleton height={20} width={120} mb={16} />
    <Skeleton height={160} radius="xl" mb={12} />
    <Skeleton height={160} radius="xl" />
  </div>
);

const WorkoutPage = () => {
  const { date } = Route.useParams();
  const { session: sessionId } = Route.useSearch();
  const navigate = useNavigate();
  const workoutKey = `${date}:${sessionId ?? ""}`;
  // Tagged with the key it was computed for, so a result from the previous date is never used.
  const lookup = useLiveQuery(
    async () => ({
      key: workoutKey,
      session:
        (sessionId
          ? await db.sessions.get(sessionId)
          : await db.sessions.where("date").equals(date).first()) ?? null,
    }),
    [workoutKey],
  );
  const stored = lookup?.key === workoutKey ? lookup.session : undefined;
  const exerciseList = useExercises();
  const exercisesById = useExercisesById();
  const categories = useCategories();
  const sessions = useSessions();

  useEffect(() => {
    pruneOldDrafts();
  }, []);

  const misdated = stored && stored.date !== date ? stored : null;
  useEffect(() => {
    if (misdated) {
      void navigate({
        to: "/workout/$date",
        params: { date: misdated.date },
        search: { session: misdated.id },
        replace: true,
      });
    }
  }, [misdated, navigate]);

  if (
    stored === undefined ||
    misdated ||
    !exerciseList ||
    !exercisesById ||
    categories === undefined ||
    sessions === undefined
  ) {
    return <WorkoutSkeleton />;
  }

  return (
    <WorkoutEditor
      // Remount per workout so the draft is resolved once; later live updates come from our own writes.
      key={workoutKey}
      date={date}
      stored={stored}
      exercisesById={exercisesById}
      exerciseList={exerciseList}
      categories={categories}
      sessions={sessions}
    />
  );
};

export const Route = createFileRoute("/workout/$date")({
  validateSearch: (search: Record<string, unknown>): { session?: string } =>
    typeof search.session === "string" && search.session ? { session: search.session } : {},
  beforeLoad: ({ params }) => {
    if (!isLoggableDate(params.date)) {
      throw redirect({ to: "/workout/$date", params: { date: todayIso() } });
    }
  },
  component: WorkoutPage,
});
