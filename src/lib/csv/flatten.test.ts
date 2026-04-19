import { describe, expect, test } from "vite-plus/test";

import { type Session } from "../../db";
import { encodeBlockExId, rowsToSessions, sessionsToRows } from "./flatten";

describe("csv flatten", () => {
  test("sessionsToRows and rowsToSessions round-trip", () => {
    const originalSessions: Session[] = [
      {
        id: "sess1",
        date: "2026-04-19",
        name: "Morning Workout",
        exercises: [
          {
            exerciseId: "ex1",
            sets: [[{ exId: "ex1", w: 100, r: 10 }], [{ exId: "ex1", w: 105, r: 8 }]],
          },
          {
            exerciseId: "ex2",
            sets: [
              [
                { exId: "ex2", w: null, r: 15 },
                { exId: "ex3", w: 20, r: null }, // superset
              ],
            ],
          },
        ],
      },
    ];

    const rows = sessionsToRows(originalSessions);

    expect(rows).toHaveLength(4);

    expect(rows[0]).toEqual({
      sessionId: "sess1",
      sessionDate: "2026-04-19",
      sessionName: "Morning Workout",
      blockExerciseId: encodeBlockExId(0, "ex1"),
      setIndex: 0,
      segmentIndex: 0,
      segmentExId: "ex1",
      weight: 100,
      repsOrSeconds: 10,
    });

    const restoredSessions = rowsToSessions(rows);
    expect(restoredSessions).toEqual(originalSessions);
  });
});
