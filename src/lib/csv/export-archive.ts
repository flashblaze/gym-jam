import { zipSync } from "fflate";
import Papa from "papaparse";

import { db } from "../../db";
import { todayIso } from "../calc";
import { sessionsToRows } from "./flatten";

export async function createExportArchive(): Promise<Blob> {
  const categories = await db.categories.toArray();
  const exercises = await db.exercises.toArray();
  const sessions = await db.sessions.toArray();

  const sessionRows = sessionsToRows(sessions);

  const categoriesCsv = Papa.unparse(categories);
  const exercisesCsv = Papa.unparse(exercises);
  const sessionsCsv = Papa.unparse(sessionRows);

  const strToBytes = (str: string) => new TextEncoder().encode(str);

  const zipped = zipSync({
    "categories.csv": strToBytes(categoriesCsv),
    "exercises.csv": strToBytes(exercisesCsv),
    "session_segments.csv": strToBytes(sessionsCsv),
  });

  return new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
}

export function downloadExport(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = todayIso();
  a.href = url;
  a.download = `gym-jam-export-${date}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
