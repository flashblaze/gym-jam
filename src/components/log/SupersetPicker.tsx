import { Drawer, UnstyledButton } from "@mantine/core";

import type { Category, Exercise } from "~/db/index";

interface SupersetPickerProps {
  opened: boolean;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
  exercises: Exercise[];
  categories: Category[];
  currentDraftExerciseIds: Set<string>;
  primaryExerciseId: string;
}

const SupersetPicker = ({
  opened,
  onClose,
  onPick,
  exercises,
  categories,
  currentDraftExerciseIds,
  primaryExerciseId,
}: SupersetPickerProps) => {
  const inDraft = exercises.filter(
    (ex) => currentDraftExerciseIds.has(ex.id) && ex.id !== primaryExerciseId,
  );
  const rest = exercises
    .filter((ex) => !currentDraftExerciseIds.has(ex.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const restByCategory: Record<string, Exercise[]> = {};
  for (const ex of rest) {
    (restByCategory[ex.category] ??= []).push(ex);
  }

  const handlePick = (exId: string) => {
    onPick(exId);
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="75%"
      title="Pair with exercise"
      styles={{ title: { fontWeight: 600 } }}
    >
      <div className="flex flex-col">
        {inDraft.length > 0 && (
          <>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">
              Already in this session
            </p>
            {inDraft.map((ex) => (
              <UnstyledButton
                key={ex.id}
                onClick={() => handlePick(ex.id)}
                className="flex w-full items-center justify-between border-b border-gray-100 py-3 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-900">{ex.name}</span>
                <span className="text-[10px] uppercase text-gray-400">
                  {categoryMap[ex.category] ?? ex.category}
                </span>
              </UnstyledButton>
            ))}
            <p className="mb-1 mt-4 text-[10px] uppercase tracking-wider text-gray-400">
              All exercises
            </p>
          </>
        )}

        {categories.map((cat) => {
          const list = restByCategory[cat.id];
          if (!list?.length) return null;
          return (
            <div key={cat.id}>
              {inDraft.length === 0 && (
                <p className="mb-1 mt-3 text-[10px] uppercase tracking-wider text-gray-400">
                  {cat.name}
                </p>
              )}
              {list.map((ex) => (
                <UnstyledButton
                  key={ex.id}
                  onClick={() => handlePick(ex.id)}
                  className="flex w-full items-center justify-between border-b border-gray-100 py-3 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-900">{ex.name}</span>
                  {inDraft.length > 0 && (
                    <span className="text-[10px] uppercase text-gray-400">
                      {categoryMap[ex.category] ?? ex.category}
                    </span>
                  )}
                </UnstyledButton>
              ))}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
};

export default SupersetPicker;
