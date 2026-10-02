import { Button, Drawer, TextInput, UnstyledButton } from "@mantine/core";
import { useState } from "react";
import IconSolarAddCircleBroken from "~icons/solar/add-circle-broken";
import IconSolarMagniferBroken from "~icons/solar/magnifer-broken";

import type { Category, Exercise } from "~/db/index";

export interface PinnedGroup {
  label: string;
  ids: string[];
}

interface ExercisePickerDrawerProps {
  opened: boolean;
  title: string;
  exercises: Exercise[];
  categories: Category[];
  pinned: PinnedGroup[];
  excludeIds: ReadonlySet<string>;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
  onCreate: (name: string) => void;
}

interface ExerciseOptionProps {
  exercise: Exercise;
  categoryName: string | undefined;
  onPick: (exerciseId: string) => void;
}

const ExerciseOption = ({ exercise, categoryName, onPick }: ExerciseOptionProps) => (
  <li>
    <UnstyledButton
      onClick={() => onPick(exercise.id)}
      className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-line px-1 py-3 hover:bg-surface-raised"
    >
      <span className="text-sm text-fg">{exercise.name}</span>
      {categoryName && (
        <span className="shrink-0 text-xs uppercase tracking-wider text-fg-faint">
          {categoryName}
        </span>
      )}
    </UnstyledButton>
  </li>
);

interface OptionGroupProps {
  label: string;
  exercises: Exercise[];
  categoryNames: Record<string, string> | undefined;
  onPick: (exerciseId: string) => void;
}

const OptionGroup = ({ label, exercises, categoryNames, onPick }: OptionGroupProps) => {
  if (exercises.length === 0) return null;
  return (
    <section className="mb-4">
      <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-fg-faint">{label}</h3>
      <ul>
        {exercises.map((ex) => (
          <ExerciseOption
            key={ex.id}
            exercise={ex}
            categoryName={categoryNames?.[ex.category]}
            onPick={onPick}
          />
        ))}
      </ul>
    </section>
  );
};

const ExercisePickerDrawer = ({
  opened,
  title,
  exercises,
  categories,
  pinned,
  excludeIds,
  onClose,
  onPick,
  onCreate,
}: ExercisePickerDrawerProps) => {
  const [query, setQuery] = useState("");

  const available = exercises.filter((ex) => !excludeIds.has(ex.id));
  const byId = Object.fromEntries(available.map((ex) => [ex.id, ex]));
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handlePick = (exerciseId: string) => {
    setQuery("");
    onPick(exerciseId);
  };

  const matches = q
    ? available
        .filter((ex) => ex.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const hasExactMatch = exercises.some((ex) => ex.name.toLowerCase() === q);

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="bottom"
      size="85%"
      title={title}
      styles={{ title: { fontWeight: 700, fontSize: 16 } }}
    >
      <TextInput
        placeholder="Search exercises"
        aria-label="Search exercises"
        size="md"
        leftSection={<IconSolarMagniferBroken />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        className="mb-3"
      />

      {q ? (
        <>
          <ul>
            {matches.map((ex) => (
              <ExerciseOption
                key={ex.id}
                exercise={ex}
                categoryName={categoryNames[ex.category]}
                onPick={handlePick}
              />
            ))}
          </ul>
          {matches.length === 0 && (
            <p className="py-4 text-center text-sm text-fg-faint">No matching exercises</p>
          )}
          {!hasExactMatch && (
            <Button
              variant="light"
              fullWidth
              className="mt-3"
              leftSection={<IconSolarAddCircleBroken />}
              onClick={() => {
                setQuery("");
                onCreate(trimmed);
              }}
            >
              Create “{trimmed}”
            </Button>
          )}
        </>
      ) : (
        <>
          {pinned.map((group) => (
            <OptionGroup
              key={group.label}
              label={group.label}
              exercises={group.ids.flatMap((id) => byId[id] ?? [])}
              categoryNames={categoryNames}
              onPick={handlePick}
            />
          ))}
          {categories.map((cat) => (
            <OptionGroup
              key={cat.id}
              label={cat.name}
              exercises={available
                .filter((ex) => ex.category === cat.id)
                .sort((a, b) => a.name.localeCompare(b.name))}
              categoryNames={undefined}
              onPick={handlePick}
            />
          ))}
        </>
      )}
    </Drawer>
  );
};

export default ExercisePickerDrawer;
