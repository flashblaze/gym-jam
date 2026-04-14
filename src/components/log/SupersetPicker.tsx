import { Drawer } from "@mantine/core";

import type { Exercise } from "~/db/index";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "~/lib/constants";

interface SupersetPickerProps {
  opened: boolean;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
  exercises: Exercise[];
  currentDraftExerciseIds: Set<string>;
  primaryExerciseId: string;
}

const SupersetPicker = ({
  opened,
  onClose,
  onPick,
  exercises,
  currentDraftExerciseIds,
  primaryExerciseId,
}: SupersetPickerProps) => {
  // Exercises already referenced in the draft (excluding primary)
  const inDraft = exercises.filter(
    (ex) => currentDraftExerciseIds.has(ex.id) && ex.id !== primaryExerciseId,
  );
  // All others sorted alphabetically
  const rest = exercises
    .filter((ex) => !currentDraftExerciseIds.has(ex.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Group rest by category in order
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
              <button
                key={ex.id}
                type="button"
                onClick={() => handlePick(ex.id)}
                className="flex w-full items-center justify-between border-b border-gray-100 py-3 text-left hover:bg-gray-50"
              >
                <span className="text-sm text-gray-900">{ex.name}</span>
                <span className="text-[10px] uppercase text-gray-400">
                  {CATEGORY_LABELS[ex.category]}
                </span>
              </button>
            ))}
            <p className="mb-1 mt-4 text-[10px] uppercase tracking-wider text-gray-400">
              All exercises
            </p>
          </>
        )}

        {CATEGORY_ORDER.map((cat) => {
          const list = restByCategory[cat];
          if (!list?.length) return null;
          return (
            <div key={cat}>
              {inDraft.length === 0 && (
                <p className="mb-1 mt-3 text-[10px] uppercase tracking-wider text-gray-400">
                  {CATEGORY_LABELS[cat]}
                </p>
              )}
              {list.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handlePick(ex.id)}
                  className="flex w-full items-center justify-between border-b border-gray-100 py-3 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-900">{ex.name}</span>
                  {inDraft.length > 0 && (
                    <span className="text-[10px] uppercase text-gray-400">
                      {CATEGORY_LABELS[ex.category]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
};

export default SupersetPicker;
