import Dexie, { type EntityTable } from "dexie";

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
  r: number;
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
    await tx.table("categories").bulkAdd([
      { id: "chest", name: "Chest" },
      { id: "back", name: "Back" },
      { id: "legs", name: "Legs" },
      { id: "shoulders", name: "Shoulders" },
      { id: "arms", name: "Arms" },
    ]);
  });

export { db };
