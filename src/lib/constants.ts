import type { Exercise } from "~/db/index";

export const TYPE_LABELS: Record<Exercise["type"], string> = {
  weighted: "Weighted",
  bodyweight: "Bodyweight",
  assisted: "Assisted",
  timed: "Timed",
};
