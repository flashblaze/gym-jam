import type { Category, Exercise, Session } from "./index";

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

const s = (exId: string, w: number | null, r: number) => ({ exId, w, r });

export const SEED_SESSIONS: Session[] = [
  {
    id: "s1",
    date: "2026-04-13",
    name: "Pull day",
    exercises: [
      { exerciseId: "pullup", sets: [[s("pullup", 40, 15)], [s("pullup", 35, 12)]] },
      {
        exerciseId: "cable-pullover",
        sets: [
          [s("cable-pullover", 25, 15)],
          [s("cable-pullover", 25, 15)],
          [s("cable-pullover", 30, 15)],
        ],
      },
      {
        exerciseId: "db-row",
        sets: [[s("db-row", 12.5, 20)], [s("db-row", 15, 18)], [s("db-row", 17.5, 12)]],
      },
      {
        exerciseId: "bb-shrug",
        sets: [[s("bb-shrug", 20, 15)], [s("bb-shrug", 20, 15)], [s("bb-shrug", 20, 15)]],
      },
    ],
  },
  {
    id: "s2",
    date: "2026-04-11",
    name: "Leg day",
    exercises: [
      {
        exerciseId: "bb-squat",
        sets: [
          [s("bb-squat", 35, 15)],
          [s("bb-squat", 40, 12), s("bw-squat", null, 10)],
          [s("bb-squat", 40, 10), s("bw-squat", null, 10)],
        ],
      },
      {
        exerciseId: "leg-press",
        sets: [[s("leg-press", 120, 10)], [s("leg-press", 120, 10)], [s("leg-press", 120, 10)]],
      },
      {
        exerciseId: "bulgarian",
        sets: [[s("bulgarian", 10, 15)], [s("bulgarian", 12.5, 17)], [s("bulgarian", 12.5, 18)]],
      },
      {
        exerciseId: "rdl",
        sets: [[s("rdl", 15, 15)], [s("rdl", 15, 15)], [s("rdl", 20, 12)]],
      },
    ],
  },
  {
    id: "s3",
    date: "2026-04-09",
    name: "Pull day",
    exercises: [
      { exerciseId: "pullup", sets: [[s("pullup", 45, 15)], [s("pullup", 40, 12)]] },
      {
        exerciseId: "lat-pd",
        sets: [[s("lat-pd", 40, 15)], [s("lat-pd", 45, 12)], [s("lat-pd", 45, 10)]],
      },
      {
        exerciseId: "seated-row",
        sets: [[s("seated-row", 40, 15)], [s("seated-row", 40, 10)], [s("seated-row", 40, 10)]],
      },
    ],
  },
  {
    id: "s4",
    date: "2026-04-07",
    name: "Push day",
    exercises: [
      {
        exerciseId: "incline-db",
        sets: [[s("incline-db", 15, 15)], [s("incline-db", 17.5, 12)], [s("incline-db", 17.5, 8)]],
      },
      {
        exerciseId: "flat-bench",
        sets: [
          [s("flat-bench", 15, 15), s("pushup", null, 10)],
          [s("flat-bench", 17.5, 12), s("pushup", null, 10)],
          [s("flat-bench", 17.5, 8), s("pushup", null, 10)],
        ],
      },
      {
        exerciseId: "pec-fly",
        sets: [[s("pec-fly", 30, 15)], [s("pec-fly", 30, 10)]],
      },
      {
        exerciseId: "dips",
        sets: [[s("dips", 55, 15)], [s("dips", 50, 15)]],
      },
    ],
  },
  {
    id: "s5",
    date: "2026-04-03",
    name: "Leg day",
    exercises: [
      {
        exerciseId: "bb-squat",
        sets: [[s("bb-squat", 30, 15)], [s("bb-squat", 35, 15)], [s("bb-squat", 37.5, 10)]],
      },
      {
        exerciseId: "leg-press",
        sets: [[s("leg-press", 120, 15)], [s("leg-press", 130, 12)], [s("leg-press", 135, 10)]],
      },
    ],
  },
  {
    id: "s6",
    date: "2026-03-27",
    name: "Leg day",
    exercises: [
      {
        exerciseId: "bb-squat",
        sets: [[s("bb-squat", 22.5, 15)], [s("bb-squat", 30, 15)], [s("bb-squat", 32.5, 12)]],
      },
      {
        exerciseId: "leg-press",
        sets: [[s("leg-press", 100, 15)], [s("leg-press", 120, 15)], [s("leg-press", 120, 15)]],
      },
    ],
  },
  {
    id: "s7",
    date: "2026-03-20",
    name: "Leg day",
    exercises: [
      {
        exerciseId: "bb-squat",
        sets: [[s("bb-squat", 17.5, 15)], [s("bb-squat", 22.5, 15)], [s("bb-squat", 27.5, 15)]],
      },
    ],
  },
  {
    id: "s8",
    date: "2026-03-13",
    name: "Leg day",
    exercises: [
      {
        exerciseId: "bb-squat",
        sets: [[s("bb-squat", 12.5, 15)], [s("bb-squat", 17.5, 15)], [s("bb-squat", 22.5, 10)]],
      },
    ],
  },
];
