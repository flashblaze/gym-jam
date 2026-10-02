import { ActionIcon, Button, Menu, Modal, Select, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconSolarMenuDotsBold from "~icons/solar/menu-dots-bold";

import { addCategory, deleteCategory, renameCategory } from "~/db/categories";
import type { Category } from "~/db/index";
import { useCategories } from "~/hooks/use-categories";
import { useExercises } from "~/hooks/use-exercises";
import { pluralize } from "~/lib/calc";
import { validateCategoryName } from "~/lib/categories";

type Dialog =
  | { kind: "add" }
  | { kind: "rename"; category: Category }
  | { kind: "delete"; category: Category };

interface CategoryDialogProps {
  dialog: Dialog;
  categories: Category[];
  exerciseCount: (categoryId: string) => number;
  onClose: () => void;
}

// Mounted per open dialog, so its fields start fresh each time.
const CategoryDialog = ({ dialog, categories, exerciseCount, onClose }: CategoryDialogProps) => {
  const [name, setName] = useState(dialog.kind === "rename" ? dialog.category.name : "");
  const [moveTo, setMoveTo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const editingId = dialog.kind === "rename" ? dialog.category.id : undefined;
  const nameError = touched ? validateCategoryName(name, categories, editingId) : null;
  const count = dialog.kind === "delete" ? exerciseCount(dialog.category.id) : 0;
  const others = categories.filter((c) => dialog.kind !== "delete" || c.id !== dialog.category.id);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true);
    try {
      await action();
      notifications.show({ title: success, message: "Categories updated.", color: "green" });
      onClose();
    } catch (err) {
      notifications.show({
        title: "Couldn't update",
        message: err instanceof Error ? err.message : "Something went wrong.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const submit = () => {
    if (dialog.kind === "delete") {
      void run(() => deleteCategory(dialog.category.id, moveTo), "Category deleted");
      return;
    }
    setTouched(true);
    if (validateCategoryName(name, categories, editingId)) return;
    if (dialog.kind === "add") void run(() => addCategory(name), "Category added");
    else void run(() => renameCategory(dialog.category.id, name), "Category renamed");
  };

  const title =
    dialog.kind === "add"
      ? "Add category"
      : dialog.kind === "rename"
        ? "Rename category"
        : `Delete “${dialog.category.name}”`;

  return (
    <Modal opened onClose={onClose} title={title}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {dialog.kind === "delete" ? (
          count === 0 ? (
            <p className="text-sm text-fg-muted">This category has no exercises.</p>
          ) : (
            <Select
              label={`Move its ${pluralize(count, "exercise")} to`}
              placeholder="Choose a category"
              data={others.map((c) => ({ value: c.id, label: c.name }))}
              value={moveTo}
              onChange={setMoveTo}
            />
          )
        ) : (
          <TextInput
            label="Name"
            placeholder="e.g. Core"
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              setTouched(true);
            }}
            error={nameError}
            data-autofocus
          />
        )}
        <Button
          type="submit"
          loading={saving}
          color={dialog.kind === "delete" ? "red" : undefined}
          disabled={dialog.kind === "delete" && count > 0 && !moveTo}
        >
          {dialog.kind === "delete" ? "Delete" : "Save"}
        </Button>
      </form>
    </Modal>
  );
};

const CategoryManager = () => {
  const categories = useCategories();
  const exercises = useExercises();
  const [dialog, setDialog] = useState<Dialog | null>(null);

  if (!categories || !exercises) return null;
  const exerciseCount = (categoryId: string) =>
    exercises.filter((e) => e.category === categoryId).length;

  return (
    <div className="flex flex-col gap-3">
      <ul>
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex min-h-12 items-center justify-between gap-3 border-b border-line py-1"
          >
            <span className="min-w-0">
              <span className="block truncate font-display text-lg leading-tight font-bold uppercase text-fg">
                {category.name}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-faint">
                {pluralize(exerciseCount(category.id), "exercise")}
              </span>
            </span>
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${category.name} options`}
                >
                  <IconSolarMenuDotsBold className="text-lg" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setDialog({ kind: "rename", category })}>
                  Rename
                </Menu.Item>
                <Menu.Item
                  color="red"
                  disabled={categories.length === 1}
                  onClick={() => setDialog({ kind: "delete", category })}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </li>
        ))}
      </ul>
      <Button
        variant="default"
        leftSection={<IconSolarAddCircleBroken />}
        onClick={() => setDialog({ kind: "add" })}
        className="self-start"
      >
        Add category
      </Button>
      {dialog && (
        <CategoryDialog
          dialog={dialog}
          categories={categories}
          exerciseCount={exerciseCount}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};

export default CategoryManager;
