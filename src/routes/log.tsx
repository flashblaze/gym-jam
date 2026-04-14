import { Button, Select } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";

import SetRow from "~/components/log/SetRow";
import SupersetPicker from "~/components/log/SupersetPicker";
import { db, type Exercise, type WorkoutSet } from "~/db/index";
import { useExercises } from "~/hooks/use-exercises";
import { nanoid, todayIso } from "~/lib/calc";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "~/lib/constants";

const LogPage = () => {
  const navigate = useNavigate();
  const exercises = useExercises();

  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [pickerSetIndex, setPickerSetIndex] = useState<number | null>(null);
  const [pickerOpened, { open: openPicker, close: closePicker }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);

  const exercisesMap: Record<string, Exercise> =
    exercises?.reduce(
      (acc, ex) => {
        acc[ex.id] = ex;
        return acc;
      },
      {} as Record<string, Exercise>,
    ) ?? {};

  // Mantine Select data grouped by category
  const selectData = exercises
    ? CATEGORY_ORDER.flatMap((cat) => {
        const list = exercises.filter((ex) => ex.category === cat);
        if (!list.length) return [];
        return [
          {
            group: CATEGORY_LABELS[cat],
            items: list.map((ex) => ({ label: ex.name, value: ex.id })),
          },
        ];
      })
    : [];

  const handleExerciseChange = (id: string | null) => {
    setExerciseId(id);
    if (id && sets.length === 0) {
      setSets([[{ exId: id, w: null, r: 0 }]]);
    }
  };

  const addSet = () => {
    if (!exerciseId) return;
    const last = sets[sets.length - 1];
    const primaryW = last?.[0].w ?? null;
    setSets((prev) => [...prev, [{ exId: exerciseId, w: primaryW, r: 0 }]]);
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
    updateSet(setIdx, [...set, { exId: exerciseId!, w: primary.w, r: 0 }]);
  };

  const openSupersetPicker = (setIdx: number) => {
    setPickerSetIndex(setIdx);
    openPicker();
  };

  const addSuperset = (partnerExId: string) => {
    if (pickerSetIndex === null) return;
    const set = sets[pickerSetIndex];
    updateSet(pickerSetIndex, [...set, { exId: partnerExId, w: null, r: 0 }]);
    setPickerSetIndex(null);
  };

  // Collect all exerciseIds referenced in the draft
  const draftExerciseIds = new Set<string>();
  if (exerciseId) draftExerciseIds.add(exerciseId);
  for (const set of sets) {
    for (const seg of set) draftExerciseIds.add(seg.exId);
  }

  const handleSave = async () => {
    if (!exerciseId) return;

    const valid = sets.filter((set) =>
      set.every((seg) => {
        const ex = exercisesMap[seg.exId];
        const needsWeight = ex && (ex.type === "weighted" || ex.type === "assisted");
        if (needsWeight && seg.w == null) return false;
        return seg.r > 0;
      }),
    );

    if (valid.length === 0) {
      notifications.show({
        title: "Incomplete sets",
        message: "Fill in weight and reps for at least one set.",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      const today = todayIso();
      let sess = await db.sessions.where("date").equals(today).first();

      if (!sess) {
        const newId = nanoid("s-");
        await db.sessions.add({ id: newId, date: today, name: "Session", exercises: [] });
        sess = await db.sessions.get(newId);
      }

      if (!sess) throw new Error("Failed to create session");

      const existing = sess.exercises.find((e) => e.exerciseId === exerciseId);
      if (existing) {
        existing.sets.push(...valid);
      } else {
        sess.exercises.push({ exerciseId, sets: valid });
      }

      await db.sessions.put(sess);

      notifications.show({
        title: "Session saved",
        message: `${valid.length} set${valid.length > 1 ? "s" : ""} logged for today.`,
        color: "green",
      });

      void navigate({ to: "/sessions/$sessionId", params: { sessionId: sess.id } });
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
      <div className="py-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/sessions" })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <IconSolarAltArrowLeftBroken className="text-base" />
          Cancel
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Log exercise</h1>
        <p className="mt-0.5 text-xs text-gray-500">Adds to today's session</p>
      </div>

      <div className="mb-5">
        <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500">
          Exercise
        </label>
        <Select
          placeholder="Choose exercise…"
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

          <button
            type="button"
            onClick={addSet}
            className="mb-5 w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            + add set
          </button>

          <Button fullWidth size="md" onClick={handleSave} loading={saving}>
            Save to today's session
          </Button>
        </>
      )}

      {exercises && (
        <SupersetPicker
          opened={pickerOpened}
          onClose={closePicker}
          onPick={addSuperset}
          exercises={exercises}
          currentDraftExerciseIds={draftExerciseIds}
          primaryExerciseId={exerciseId ?? ""}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute("/log")({
  component: LogPage,
});
