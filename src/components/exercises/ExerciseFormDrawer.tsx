import { Button, Drawer, Select, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import IconSolarTrashBinMinimalisticBroken from "~icons/solar/trash-bin-minimalistic-broken";

import { type Category, type Exercise, db } from "~/db/index";
import { nanoid } from "~/lib/calc";
import { TYPE_LABELS } from "~/lib/constants";

export interface ExerciseFormValues {
  name: string;
  category: string;
  type: Exercise["type"];
}

const NEW_CATEGORY = "__new__";

const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as Exercise["type"][]).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));

function isExerciseType(value: string | null): value is Exercise["type"] {
  return value !== null && value in TYPE_LABELS;
}

function notifyInvalid(title: string, message: string) {
  notifications.show({ title, message, color: "red" });
}

interface ExerciseFormProps {
  initial: { name: string; category: string | null; type: Exercise["type"] };
  categories: Category[];
  submitLabel: string;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
  onDelete?: () => void;
}

// Mounted only while the drawer is open, so state starts fresh from `initial` on every open.
const ExerciseForm = ({
  initial,
  categories,
  submitLabel,
  onSubmit,
  onDelete,
}: ExerciseFormProps) => {
  const [name, setName] = useState(initial.name);
  const [categoryId, setCategoryId] = useState(initial.category);
  const [newCatName, setNewCatName] = useState("");
  const [type, setType] = useState<Exercise["type"]>(initial.type);
  const [saving, setSaving] = useState(false);

  const categoryOptions = [
    { value: NEW_CATEGORY, label: "+ New category…" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return notifyInvalid("Missing name", "Enter an exercise name.");
    if (!categoryId) return notifyInvalid("Missing category", "Select or create a category.");
    if (categoryId === NEW_CATEGORY && !newCatName.trim()) {
      return notifyInvalid("Missing category name", "Enter a name for the new category.");
    }

    setSaving(true);
    try {
      let category = categoryId;
      if (categoryId === NEW_CATEGORY) {
        category = nanoid("cat-");
        await db.categories.add({ id: category, name: newCatName.trim() });
      }
      await onSubmit({ name: trimmedName, category, type });
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
    <form
      className="flex flex-col gap-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
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
      {categoryId === NEW_CATEGORY && (
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
        onChange={(value) => isExerciseType(value) && setType(value)}
        allowDeselect={false}
      />
      <Button type="submit" loading={saving} fullWidth>
        {submitLabel}
      </Button>
      {onDelete && (
        <Button
          variant="subtle"
          color="red"
          fullWidth
          leftSection={<IconSolarTrashBinMinimalisticBroken />}
          onClick={onDelete}
        >
          Delete exercise
        </Button>
      )}
    </form>
  );
};

interface ExerciseFormDrawerProps extends ExerciseFormProps {
  opened: boolean;
  title: string;
  onClose: () => void;
}

const ExerciseFormDrawer = ({ opened, title, onClose, ...formProps }: ExerciseFormDrawerProps) => (
  <Drawer
    opened={opened}
    onClose={onClose}
    position="bottom"
    size="auto"
    title={title}
    styles={{ title: { fontWeight: 700, fontSize: 16 } }}
  >
    <ExerciseForm {...formProps} />
  </Drawer>
);

export default ExerciseFormDrawer;
