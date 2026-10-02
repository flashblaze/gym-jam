import { describe, expect, test } from "vite-plus/test";

import type { Exercise, Session } from "~/db/index";

import {
  DELETED_EXERCISE_LABEL,
  appendDrop,
  appendSet,
  appendSuperset,
  emptySegment,
  formatSegmentValue,
  formatSet,
  isSegmentComplete,
  isSetComplete,
  remapExercise,
  stripExercises,
} from "./sets";

const bench: Exercise = { id: "bench", name: "Bench Press Flat", category: "c", type: "weighted" };
const pullup: Exercise = { id: "pullup", name: "Pull Up", category: "c", type: "bodyweight" };
const plank: Exercise = { id: "plank", name: "Plank", category: "c", type: "timed" };
const exercises = { bench, pullup, plank };

describe("isSegmentComplete", () => {
  test("weighted needs weight and positive reps", () => {
    expect(isSegmentComplete({ exId: "bench", w: 80, r: 8 }, "weighted")).toBe(true);
    expect(isSegmentComplete({ exId: "bench", w: null, r: 8 }, "weighted")).toBe(false);
    expect(isSegmentComplete({ exId: "bench", w: 80, r: 0 }, "weighted")).toBe(false);
    expect(isSegmentComplete({ exId: "bench", w: 80, r: null }, "weighted")).toBe(false);
  });

  test("bodyweight needs only reps", () => {
    expect(isSegmentComplete({ exId: "pullup", w: null, r: 10 }, "bodyweight")).toBe(true);
  });

  test("timed needs a positive duration", () => {
    expect(isSegmentComplete({ exId: "plank", w: null, r: 60 }, "timed")).toBe(true);
    expect(isSegmentComplete({ exId: "plank", w: null, r: 0 }, "timed")).toBe(false);
  });

  test("unknown exercise needs only reps", () => {
    expect(isSegmentComplete({ exId: "gone", w: null, r: 5 }, undefined)).toBe(true);
    expect(isSegmentComplete({ exId: "gone", w: null, r: null }, undefined)).toBe(false);
  });

  test("isSetComplete checks every segment against its own exercise", () => {
    const set = [
      { exId: "bench", w: 80, r: 8 },
      { exId: "pullup", w: null, r: null },
    ];
    expect(isSetComplete(set, exercises)).toBe(false);
    expect(isSetComplete([set[0], { ...set[1], r: 6 }], exercises)).toBe(true);
  });
});

describe("set builders", () => {
  test("emptySegment starts timed at 0 and others unentered", () => {
    expect(emptySegment("plank", "timed")).toEqual({ exId: "plank", w: null, r: 0 });
    expect(emptySegment("bench", "weighted", 60)).toEqual({ exId: "bench", w: 60, r: null });
  });

  test("appendSet carries over the previous primary weight", () => {
    const sets = appendSet([[{ exId: "bench", w: 80, r: 8 }]], "bench", "weighted");
    expect(sets[1]).toEqual([emptySegment("bench", "weighted", 80)]);
    expect(appendSet([], "bench", "weighted")).toEqual([[emptySegment("bench", "weighted")]]);
  });

  test("appendDrop reuses the primary exercise and weight", () => {
    const set = appendDrop([{ exId: "bench", w: 80, r: 8 }], "weighted");
    expect(set[1]).toEqual(emptySegment("bench", "weighted", 80));
  });

  test("appendSuperset adds an empty partner segment", () => {
    const set = appendSuperset([{ exId: "bench", w: 80, r: 8 }], "pullup", "bodyweight");
    expect(set[1]).toEqual(emptySegment("pullup", "bodyweight"));
  });
});

describe("formatting", () => {
  test("formatSegmentValue", () => {
    expect(formatSegmentValue({ exId: "bench", w: 80, r: 8 }, "weighted")).toBe("80×8");
    expect(formatSegmentValue({ exId: "pullup", w: null, r: null }, "bodyweight")).toBe("×—");
    expect(formatSegmentValue({ exId: "plank", w: null, r: 90 }, "timed")).toBe("1m 30s");
  });

  test("formatSet marks drops with → and superset partners with +", () => {
    const set = [
      { exId: "bench", w: 80, r: 8 },
      { exId: "bench", w: 60, r: 6 },
      { exId: "pullup", w: null, r: 10 },
      { exId: "gone", w: null, r: 5 },
    ];
    expect(formatSet(set, "bench", exercises)).toBe(
      `80×8 → 60×6 + Pull Up ×10 + ${DELETED_EXERCISE_LABEL} ×5`,
    );
  });
});

describe("stripExercises", () => {
  const session: Session = {
    id: "s1",
    date: "2026-10-02",
    name: "Session",
    exercises: [
      {
        exerciseId: "bench",
        sets: [
          [
            { exId: "bench", w: 80, r: 8 },
            { exId: "pullup", w: null, r: 10 },
          ],
        ],
      },
      { exerciseId: "pullup", sets: [[{ exId: "pullup", w: null, r: 12 }]] },
    ],
  };

  test("removes owned blocks and superset segments", () => {
    expect(stripExercises(session, new Set(["pullup"]))?.exercises).toEqual([
      { exerciseId: "bench", sets: [[{ exId: "bench", w: 80, r: 8 }]] },
    ]);
  });

  test("returns null when the session does not reference the exercises", () => {
    expect(stripExercises(session, new Set(["plank"]))).toBeNull();
  });
});

describe("remapExercise", () => {
  const session: Session = {
    id: "s1",
    date: "2026-10-02",
    name: "",
    exercises: [
      {
        exerciseId: "old",
        sets: [
          [
            { exId: "old", w: 10, r: 10 },
            { exId: "bench", w: 80, r: 5 },
          ],
        ],
      },
      {
        exerciseId: "bench",
        sets: [
          [
            { exId: "bench", w: 80, r: 8 },
            { exId: "old", w: 5, r: 12 },
          ],
        ],
      },
    ],
  };

  test("re-points blocks and superset segments, keeping values", () => {
    const result = remapExercise(session, "old", "new");
    expect(result?.exercises[0].exerciseId).toBe("new");
    expect(result?.exercises[0].sets[0][0]).toEqual({ exId: "new", w: 10, r: 10 });
    expect(result?.exercises[1].sets[0][1]).toEqual({ exId: "new", w: 5, r: 12 });
    expect(result?.exercises[1].exerciseId).toBe("bench");
  });

  test("returns null when the exercise isn't used", () => {
    expect(remapExercise(session, "plank", "new")).toBeNull();
  });
});
