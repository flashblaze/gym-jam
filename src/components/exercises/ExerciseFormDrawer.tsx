import { Button, Drawer, Select, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import IconSolarTrashBinMinimalisticBroken from "~icons/solar/trash-bin-minimalistic-broken";
import IconTablerArrowMerge from "~icons/tabler/arrow-merge";

import { addCategory } from "~/db/categories";
import type { Category, Exercise } from "~/db/index";
import { useExercises } from "~/hooks/use-exercises";
import { validateCategoryName } from "~/lib/categories";
import { TYPE_LABELS } from "~/lib/constants";
import { findSimilarExercises } from "~/lib/exercise-names";

import ExerciseNameHints from "./ExerciseNameHints";

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
  /** The exercise being edited, so it isn't reported as its own duplicate. */
  excludeId?: string;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
  /** Offered on duplicate warnings ("Use this") instead of creating another exercise. */
  onUseExisting?: (exercise: Exercise) => void;
  onMerge?: () => void;
  onDelete?: () => void;
}

// Mounted only while the drawer is open, so state starts fresh from `initial` on every open.
const ExerciseForm = ({
  initial,
  categories,
  submitLabel,
  excludeId,
  onSubmit,
  onUseExisting,
  onMerge,
  onDelete,
}: ExerciseFormProps) => {
  const exercises = useExercises() ?? [];
  const [name, setName] = useState(initial.name);
  const [categoryId, setCategoryId] = useState(initial.category);
  const [newCatName, setNewCatName] = useState("");
  const [type, setType] = useState<Exercise["type"]>(initial.type);
  const [saving, setSaving] = useState(false);

  const similar = findSimilarExercises(name, exercises, excludeId);
  const newCategoryError =
    categoryId === NEW_CATEGORY && newCatName ? validateCategoryName(newCatName, categories) : null;

  const categoryOptions = [
    { value: NEW_CATEGORY, label: "+ New category…" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return notifyInvalid("Missing name", "Enter an exercise name.");
    // Shown inline under the name field.
    if (similar.exact) return;
    if (!categoryId) return notifyInvalid("Missing category", "Select or create a category.");
    if (categoryId === NEW_CATEGORY) {
      const error = validateCategoryName(newCatName, categories);
      if (error) return notifyInvalid("Check the category name", error);
    }

    setSaving(true);
    try {
      const category =
        categoryId === NEW_CATEGORY ? (await addCategory(newCatName)).id : categoryId;
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
        error={similar.exact && `Already exists as “${similar.exact.name}”`}
        data-autofocus
      />
      <ExerciseNameHints similar={similar} onUseExisting={onUseExisting} />
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
          error={newCategoryError}
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
      {onMerge && (
        <Button
          variant="subtle"
          color="gray"
          fullWidth
          leftSection={<IconTablerArrowMerge />}
          onClick={onMerge}
        >
          Merge into another exercise…
        </Button>
      )}
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
  <Drawer opened={opened} onClose={onClose} position="bottom" size="auto" title={title}>
    <ExerciseForm {...formProps} />
  </Drawer>
);

export default ExerciseFormDrawer;
