import { Button, Drawer, Select, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import type { Category } from "~/db/index";
import { db } from "~/db/index";
import { nanoid } from "~/lib/calc";
import { TYPE_LABELS } from "~/lib/constants";

interface CreateExerciseDrawerProps {
  opened: boolean;
  onClose: () => void;
  categories: Category[];
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[]).map((k) => ({
  value: k,
  label: TYPE_LABELS[k],
}));

const CreateExerciseDrawer = ({ opened, onClose, categories }: CreateExerciseDrawerProps) => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [type, setType] = useState<string | null>("weighted");
  const [saving, setSaving] = useState(false);

  const categoryOptions = [
    { value: "__new__", label: "+ New category…" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const reset = () => {
    setName("");
    setCategoryId(null);
    setNewCatName("");
    setType("weighted");
  };

  const handleClose = () => {
    reset();
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

      await db.exercises.add({
        id: nanoid("ex-"),
        name: name.trim(),
        category: resolvedCatId,
        type: type as "weighted" | "bodyweight" | "assisted" | "timed",
      });

      notifications.show({ title: "Exercise created", message: name.trim(), color: "green" });
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
      title="New exercise"
      styles={{ title: { fontWeight: 600 } }}
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
          onChange={setCategoryId}
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

        <Select label="Type" data={TYPE_OPTIONS} value={type} onChange={setType} />

        <Button onClick={() => void handleSave()} loading={saving} fullWidth>
          Create exercise
        </Button>
      </div>
    </Drawer>
  );
};

export default CreateExerciseDrawer;
