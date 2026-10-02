import { notifications } from "@mantine/notifications";

import { type Category, type Exercise, db } from "~/db/index";
import { nanoid } from "~/lib/calc";

import ExerciseFormDrawer from "./ExerciseFormDrawer";

interface CreateExerciseDrawerProps {
  opened: boolean;
  onClose: () => void;
  categories: Category[];
  initialName?: string;
  onCreated?: (exercise: Exercise) => void;
}

const CreateExerciseDrawer = ({
  opened,
  onClose,
  categories,
  initialName = "",
  onCreated,
}: CreateExerciseDrawerProps) => (
  <ExerciseFormDrawer
    opened={opened}
    onClose={onClose}
    title="New exercise"
    submitLabel="Create exercise"
    categories={categories}
    initial={{ name: initialName, category: null, type: "weighted" }}
    onSubmit={async (values) => {
      const exercise: Exercise = { id: nanoid("ex-"), ...values };
      await db.exercises.add(exercise);
      notifications.show({ title: "Exercise created", message: exercise.name, color: "green" });
      onClose();
      onCreated?.(exercise);
    }}
  />
);

export default CreateExerciseDrawer;
