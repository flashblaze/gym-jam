import { Button, Drawer, Select, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";

import type { Category, Exercise } from "~/db/index";
import { db } from "~/db/index";
import { nanoid } from "~/lib/calc";
import { TYPE_LABELS } from "~/lib/constants";

interface EditExerciseDrawerProps {
  opened: boolean;
  onClose: () => void;
  exercise: Exercise;
  categories: Category[];
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[]).map((k) => ({
  value: k,
  label: TYPE_LABELS[k],
}));

const EditExerciseDrawer = ({ opened, onClose, exercise, categories }: EditExerciseDrawerProps) => {
  const [name, setName] = useState(exercise.name);
  const [categoryId, setCategoryId] = useState<string | null>(exercise.category);
  const [newCatName, setNewCatName] = useState("");
  const [type, setType] = useState<string | null>(exercise.type);
  const [saving, setSaving] = useState(false);

  // Reset form whenever the exercise prop changes or drawer opens
  useEffect(() => {
    if (opened) {
      setName(exercise.name);
      setCategoryId(exercise.category);
      setNewCatName("");
      setType(exercise.type);
    }
  }, [opened, exercise]);

  const categoryOptions = [
    { value: "__new__", label: "+ New category…" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleClose = () => {
    setNewCatName("");
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      notifications.show({
        title: "Missing name",
        message: "Enter an exercise name.",
        color: "red",
      });
      return;
    }
    if (!categoryId) {
      notifications.show({
        title: "Missing category",
        message: "Select or create a category.",
        color: "red",
      });
      return;
    }
    if (categoryId === "__new__" && !newCatName.trim()) {
      notifications.show({
        title: "Missing category name",
        message: "Enter a name for the new category.",
        color: "red",
      });
      return;
    }
    if (!type) return;

    setSaving(true);
    try {
      let resolvedCatId = categoryId;
      if (categoryId === "__new__") {
        resolvedCatId = nanoid("cat-");
        await db.categories.add({ id: resolvedCatId, name: newCatName.trim() });
      }

      await db.exercises.put({
        id: exercise.id,
        name: name.trim(),
        category: resolvedCatId,
        type: type as "weighted" | "bodyweight" | "assisted" | "timed",
      });

      notifications.show({ title: "Exercise updated", message: name.trim(), color: "green" });
      handleClose();
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
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="bottom"
      size="auto"
      title="Edit exercise"
      styles={{ title: { fontWeight: 700, fontSize: 16 } }}
    >
      <div className="flex flex-col gap-4 pb-4">
        <TextInput
          label="Name"
          placeholder="e.g. Bench Press"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          data-autofocus
        />

        <Select
          label="Category"
          placeholder="Choose…"
          data={categoryOptions}
          value={categoryId}
          onChange={(value) => setCategoryId(value)}
          searchable
        />

        {categoryId === "__new__" && (
          <TextInput
            label="New category name"
            placeholder="e.g. Core"
            value={newCatName}
            onChange={(e) => setNewCatName(e.currentTarget.value)}
          />
        )}

        <Select
          label="Type"
          data={TYPE_OPTIONS}
          value={type}
          onChange={(value) => setType(value)}
        />

        <Button onClick={() => void handleSave()} loading={saving} fullWidth>
          Save changes
        </Button>
      </div>
    </Drawer>
  );
};

export default EditExerciseDrawer;
