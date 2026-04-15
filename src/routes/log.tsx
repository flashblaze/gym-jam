import { Button, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";

import SetRow from "~/components/log/SetRow";
import SupersetPicker from "~/components/log/SupersetPicker";
import { db, type Exercise, type WorkoutSet } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises } from "~/hooks/use-exercises";
import { nanoid, todayIso } from "~/lib/calc";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const LogPage = () => {
  const navigate = useNavigate();
  const exercises = useExercises();
  const categories = useCategories();
  const { date: dateFromSearch } = Route.useSearch();

  const [logDate, setLogDate] = useState<string | null>(() => dateFromSearch ?? todayIso());
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [pickerSetIndex, setPickerSetIndex] = useState<number | null>(null);
  const [pickerOpened, { open: openPicker, close: closePicker }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dateFromSearch) setLogDate(dateFromSearch);
  }, [dateFromSearch]);

  const exercisesMap: Record<string, Exercise> =
    exercises?.reduce(
      (acc, ex) => {
        acc[ex.id] = ex;
        return acc;
      },
      {} as Record<string, Exercise>,
    ) ?? {};

  const selectData =
    exercises && categories
      ? categories.flatMap((cat) => {
          const list = exercises.filter((ex) => ex.category === cat.id);
          if (!list.length) return [];
          return [
            {
              group: cat.name,
              items: list.map((ex) => ({ label: ex.name, value: ex.id })),
            },
          ];
        })
      : [];

  const handleExerciseChange = (id: string | null) => {
    setExerciseId(id);
    if (id && sets.length === 0) {
      const ex = exercisesMap[id];
      const initialR = ex?.type === "timed" ? 0 : null;
      setSets([[{ exId: id, w: null, r: initialR }]]);
    }
  };

  const addSet = () => {
    if (!exerciseId) return;
    const last = sets[sets.length - 1];
    const primaryW = last?.[0].w ?? null;
    const ex = exercisesMap[exerciseId];
    const initialR = ex?.type === "timed" ? 0 : null;
    setSets((prev) => [...prev, [{ exId: exerciseId, w: primaryW, r: initialR }]]);
  };

  const updateSet = (idx: number, updated: WorkoutSet) => {
    setSets((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  };

  const removeSet = (idx: number) => {
    setSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDrop = (setIdx: number) => {
    const set = sets[setIdx];
    const primary = set[0];
    const ex = exercisesMap[exerciseId!];
    const initialR = ex?.type === "timed" ? 0 : null;
    updateSet(setIdx, [...set, { exId: exerciseId!, w: primary.w, r: initialR }]);
  };

  const openSupersetPicker = (setIdx: number) => {
    setPickerSetIndex(setIdx);
    openPicker();
  };

  const addSuperset = (partnerExId: string) => {
    if (pickerSetIndex === null) return;
    const set = sets[pickerSetIndex];
    const partnerEx = exercisesMap[partnerExId];
    const initialR = partnerEx?.type === "timed" ? 0 : null;
    updateSet(pickerSetIndex, [...set, { exId: partnerExId, w: null, r: initialR }]);
    setPickerSetIndex(null);
  };

  const draftExerciseIds = new Set<string>();
  if (exerciseId) draftExerciseIds.add(exerciseId);
  for (const set of sets) {
    for (const seg of set) draftExerciseIds.add(seg.exId);
  }

  const handleSave = async () => {
    if (!exerciseId) return;
    const ex = exercisesMap[exerciseId];
    const isTimed = ex?.type === "timed";

    const valid = sets.filter((set) =>
      set.every((seg) => {
        const segEx = exercisesMap[seg.exId];
        if (segEx?.type === "timed") return (seg.r ?? 0) > 0;
        const needsWeight = segEx && (segEx.type === "weighted" || segEx.type === "assisted");
        if (needsWeight && seg.w == null) return false;
        return seg.r != null && seg.r > 0;
      }),
    );

    if (valid.length === 0) {
      notifications.show({
        title: "Incomplete sets",
        message: isTimed
          ? "Enter a duration for at least one set."
          : "Fill in weight and reps for at least one set.",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const today = logDate ?? todayIso();

      // Single transaction: one round-trip instead of 3–4 separate ones.
      const savedSessionId = await db.transaction("rw", db.sessions, async () => {
        let sess = await db.sessions.where("date").equals(today).first();

        if (!sess) {
          const newId = nanoid("s-");
          sess = { id: newId, date: today, name: "Session", exercises: [] };
          await db.sessions.add(sess);
        }

        const existing = sess.exercises.find((e) => e.exerciseId === exerciseId);
        if (existing) {
          existing.sets.push(...valid);
        } else {
          sess.exercises.push({ exerciseId, sets: valid });
        }

        await db.sessions.put(sess);
        return sess.id;
      });

      notifications.show({
        title: "Session saved",
        message: `${valid.length} set${valid.length > 1 ? "s" : ""} logged.`,
        color: "green",
      });

      void navigate({ to: `/sessions/${savedSessionId}` });
    } catch (err) {
      notifications.show({
        title: "Save failed",
        message: err instanceof Error ? err.message : "Something went wrong.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pb-6">
      <div className="py-5">
        <Button
          variant="default"
          size="compact-sm"
          leftSection={<IconSolarAltArrowLeftBroken />}
          onClick={() => void navigate({ to: "/sessions" })}
        >
          Cancel
        </Button>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#d4d4e0]">Log exercise</h1>
        <p className="mt-0.5 text-xs text-[#565670]">Adds to the selected day&apos;s session</p>
      </div>

      <div className="mb-4">
        <DateInput
          label="Date"
          size="md"
          value={logDate ? new Date(logDate + "T00:00:00") : null}
          onChange={(v) => setLogDate(v ? dayjs(v).format("YYYY-MM-DD") : todayIso())}
          valueFormat="DD MMM YYYY"
          maxDate={new Date()}
          className="w-full"
        />
      </div>

      <div className="mb-5">
        <Select
          label="Exercise"
          placeholder="Choose exercise…"
          size="md"
          data={selectData}
          value={exerciseId}
          onChange={handleExerciseChange}
          searchable
          className="w-full"
        />
      </div>

      {exerciseId && (
        <>
          <div className="mb-4 flex flex-col gap-3">
            {sets.map((set, idx) => (
              <SetRow
                key={idx}
                set={set}
                index={idx}
                primaryExerciseId={exerciseId}
                exercises={exercisesMap}
                onChange={(updated) => updateSet(idx, updated)}
                onRemove={() => removeSet(idx)}
                onAddDrop={() => addDrop(idx)}
                onAddSuperset={() => openSupersetPicker(idx)}
              />
            ))}
          </div>

          <Button variant="default" fullWidth className="mb-5 border-dashed" onClick={addSet}>
            + Add set
          </Button>

          <Button fullWidth size="md" onClick={() => void handleSave()} loading={saving}>
            Save to session
          </Button>
        </>
      )}

      {exercises && categories && (
        <SupersetPicker
          opened={pickerOpened}
          onClose={closePicker}
          onPick={addSuperset}
          exercises={exercises}
          categories={categories}
          currentDraftExerciseIds={draftExerciseIds}
          primaryExerciseId={exerciseId ?? ""}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute("/log")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => {
    const raw = search.date;
    if (typeof raw !== "string" || !ISO_DATE.test(raw)) return {};
    const d = dayjs(raw, "YYYY-MM-DD", true);
    if (!d.isValid() || d.isAfter(dayjs(), "day")) return {};
    return { date: raw };
  },
  component: LogPage,
});
