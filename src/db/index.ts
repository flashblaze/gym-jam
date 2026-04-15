import Dexie, { type EntityTable } from "dexie";

import { SEED_CATEGORIES } from "./seed";

export interface Category {
  id: string;
  name: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string; // references Category.id
  type: "weighted" | "bodyweight" | "assisted" | "timed";
}

export interface Segment {
  exId: string;
  w: number | null;
  /** Reps or timed duration (seconds). `null` = not entered (non-timed). */
  r: number | null;
}

export type WorkoutSet = Segment[];

export interface SessionExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface Session {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  exercises: SessionExercise[];
}

const db = new Dexie("GymJamDB") as Dexie & {
  exercises: EntityTable<Exercise, "id">;
  sessions: EntityTable<Session, "id">;
  categories: EntityTable<Category, "id">;
};

db.version(1).stores({
  exercises: "id, category",
  sessions: "id, date",
});

db.version(2)
  .stores({ categories: "id, name" })
  .upgrade(async (tx) => {
    await tx.table("categories").bulkAdd(SEED_CATEGORIES);
  });

export { db };
