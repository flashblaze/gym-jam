import { notifications } from "@mantine/notifications";

import { type Category, type Exercise, db } from "~/db/index";

import ExerciseFormDrawer from "./ExerciseFormDrawer";

interface EditExerciseDrawerProps {
  opened: boolean;
  onClose: () => void;
  exercise: Exercise;
  categories: Category[];
  onDelete: () => void;
}

const EditExerciseDrawer = ({
  opened,
  onClose,
  exercise,
  categories,
  onDelete,
}: EditExerciseDrawerProps) => (
  <ExerciseFormDrawer
    opened={opened}
    onClose={onClose}
    title="Edit exercise"
    submitLabel="Save changes"
    categories={categories}
    initial={exercise}
    onSubmit={async (values) => {
      await db.exercises.put({ id: exercise.id, ...values });
      notifications.show({ title: "Exercise updated", message: values.name, color: "green" });
      onClose();
    }}
    onDelete={onDelete}
  />
);

export default EditExerciseDrawer;
