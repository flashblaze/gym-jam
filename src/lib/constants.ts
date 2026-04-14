import type { Exercise } from "~/db/index";

export const CATEGORY_ORDER: Exercise["category"][] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
];

export const CATEGORY_LABELS: Record<Exercise["category"], string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
};

export const TYPE_LABELS: Record<Exercise["type"], string> = {
  weighted: "Weighted",
  bodyweight: "Bodyweight",
  assisted: "Assisted",
};
