import { unzipSync } from "fflate";
import Papa from "papaparse";
import { z } from "zod";

import { type Session, db } from "../../db";
import { decodeBlockExId, rowsToSessions } from "./flatten";
import {
  type CategoryRow,
  type ExerciseRow,
  categoryRowSchema,
  exerciseRowSchema,
  sessionSegmentRowSchema,
} from "./schemas";

function stripBOM(str: string): string {
  if (str.charCodeAt(0) === 0xfeff) {
    return str.slice(1);
  }
  return str;
}

export interface ParsedArchive {
  categories: CategoryRow[];
  exercises: ExerciseRow[];
  sessions: Session[];
}

/** Reads and fully validates an export archive without touching the database. */
export async function parseArchive(file: File): Promise<ParsedArchive> {
  const buffer = await file.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(buffer));

  const getCsv = (name: string) => {
    if (!unzipped[name]) {
      throw new Error(`Missing required file in archive: ${name}`);
    }
    return stripBOM(new TextDecoder().decode(unzipped[name]));
  };

  const categoriesCsv = getCsv("categories.csv");
  const exercisesCsv = getCsv("exercises.csv");
  const sessionsCsv = getCsv("session_segments.csv");

  const parseCsv = <T>(csv: string, schema: z.ZodType<T>, fileName: string) => {
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV Parsing error in ${fileName}: ${parsed.errors[0].message}`);
    }

    return parsed.data.map((row, i) => {
      const res = schema.safeParse(row);
      if (!res.success) {
        throw new Error(
          `Validation error in ${fileName} (row ${i + 1}): ${res.error.issues[0].message}`,
        );
      }
      return res.data;
    });
  };

  const categoriesRows = parseCsv(categoriesCsv, categoryRowSchema, "categories.csv");
  const exercisesRows = parseCsv(exercisesCsv, exerciseRowSchema, "exercises.csv");
  const sessionRows = parseCsv(sessionsCsv, sessionSegmentRowSchema, "session_segments.csv");

  // Referential checks
  const categoryIds = new Set(categoriesRows.map((c) => c.id));
  for (const ex of exercisesRows) {
    if (!categoryIds.has(ex.category)) {
      throw new Error(`Exercise "${ex.name}" references unknown category ID "${ex.category}"`);
    }
  }

  const exerciseIds = new Set(exercisesRows.map((e) => e.id));
  const exTypeMap = new Map<string, string>(exercisesRows.map((e) => [e.id, e.type]));

  for (const [i, row] of sessionRows.entries()) {
    if (!exerciseIds.has(row.segmentExId)) {
      throw new Error(
        `Session segment row ${i + 1} references unknown exercise ID "${row.segmentExId}"`,
      );
    }

    const baseBlockExId = decodeBlockExId(row.blockExerciseId);
    if (!exerciseIds.has(baseBlockExId)) {
      throw new Error(
        `Session segment row ${i + 1} references unknown block exercise ID "${baseBlockExId}"`,
      );
    }

    const type = exTypeMap.get(row.segmentExId);
    if (type === "timed" && (row.repsOrSeconds === null || row.repsOrSeconds <= 0)) {
      throw new Error(
        `Session segment row ${i + 1}: Timed exercise requires a positive duration in repsOrSeconds`,
      );
    }
    if (type !== "timed" && row.repsOrSeconds === null) {
      throw new Error(`Session segment row ${i + 1}: Exercise requires reps (repsOrSeconds)`);
    }
    if (row.weight !== null && row.weight < 0) {
      throw new Error(`Session segment row ${i + 1}: Weight must be non-negative`);
    }
  }

  return {
    categories: categoriesRows,
    exercises: exercisesRows,
    sessions: rowsToSessions(sessionRows),
  };
}

/** Replaces all local data with a parsed archive. */
export async function writeArchive(archive: ParsedArchive): Promise<void> {
  await db.transaction("rw", [db.categories, db.exercises, db.sessions], async () => {
    await db.sessions.clear();
    await db.exercises.clear();
    await db.categories.clear();

    await db.categories.bulkPut(archive.categories);
    await db.exercises.bulkPut(archive.exercises);
    await db.sessions.bulkPut(archive.sessions);
  });
}
