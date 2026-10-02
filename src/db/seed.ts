import type { Category, Exercise } from "./index";

export const SEED_CATEGORIES: Category[] = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "legs", name: "Legs" },
  { id: "shoulders", name: "Shoulders" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },
];

export const SEED_EXERCISES: Exercise[] = [
  { id: "flat-bench", name: "Flat barbell bench press", category: "chest", type: "weighted" },
  { id: "incline-db", name: "Incline dumbbell bench press", category: "chest", type: "weighted" },
  { id: "pec-fly", name: "Pec flies", category: "chest", type: "weighted" },
  { id: "pushup", name: "Push-ups", category: "chest", type: "bodyweight" },
  { id: "dips", name: "Dips", category: "triceps", type: "assisted" },
  { id: "pullup", name: "Pull-ups", category: "back", type: "assisted" },
  { id: "lat-pd", name: "Lat pulldown", category: "back", type: "weighted" },
  { id: "cable-pullover", name: "Cable pullovers", category: "back", type: "weighted" },
  { id: "seated-row", name: "Seated rows", category: "back", type: "weighted" },
  { id: "db-row", name: "Single arm dumbbell rows", category: "back", type: "weighted" },
  { id: "bb-shrug", name: "Barbell shrugs", category: "back", type: "weighted" },
  { id: "bb-squat", name: "Barbell squats", category: "legs", type: "weighted" },
  { id: "bw-squat", name: "Bodyweight squats", category: "legs", type: "bodyweight" },
  { id: "leg-press", name: "Leg press", category: "legs", type: "weighted" },
  { id: "bulgarian", name: "Bulgarian split squats", category: "legs", type: "weighted" },
  { id: "leg-ext", name: "Leg extensions", category: "legs", type: "weighted" },
  { id: "rdl", name: "Romanian deadlift", category: "legs", type: "weighted" },
  { id: "db-ohp", name: "Dumbbell overhead press", category: "shoulders", type: "weighted" },
  { id: "lat-raise", name: "Dumbbell lateral raises", category: "shoulders", type: "weighted" },
  { id: "rev-fly", name: "Reverse pec flies", category: "shoulders", type: "weighted" },
  { id: "bb-curl", name: "Barbell curls", category: "biceps", type: "weighted" },
  { id: "preacher", name: "Preacher curls", category: "biceps", type: "weighted" },
  { id: "tri-ext", name: "Triceps extensions", category: "triceps", type: "weighted" },
];
