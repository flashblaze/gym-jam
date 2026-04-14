import Dexie, { type EntityTable } from "dexie";

export interface Exercise {
  id: string;
  name: string;
  category: "chest" | "back" | "legs" | "shoulders" | "arms";
  type: "weighted" | "bodyweight" | "assisted";
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
};

db.version(1).stores({
  exercises: "id, category",
  sessions: "id, date",
});

export { db };
