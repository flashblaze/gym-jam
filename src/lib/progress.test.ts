import { describe, expect, test } from "vite-plus/test";

import type { Exercise, Session } from "~/db/index";

import {
  METRIC_INFO,
  bestOf,
  bestSegment,
  computeMetrics,
  countSessionsUsing,
  epley1rm,
  exerciseHistory,
  exerciseSummaries,
} from "./progress";

const bench: Exercise = { id: "bench", name: "Bench", category: "c", type: "weighted" };
const dip: Exercise = { id: "dip", name: "Assisted Dip", category: "c", type: "assisted" };
const exercises = { bench, dip };

function session(id: string, date: string, sets: Session["exercises"][number]["sets"]): Session {
  return { id, date, name: "Session", exercises: [{ exerciseId: sets[0][0].exId, sets }] };
}

describe("epley1rm", () => {
  test("a single rep is the lift itself", () => {
    expect(epley1rm(100, 1)).toBe(100);
    expect(epley1rm(100, 10)).toBeCloseTo(133.33, 2);
  });
});

describe("computeMetrics", () => {
  test("derives weight, e1RM, volume and reps", () => {
    const m = computeMetrics([
      { exId: "bench", w: 80, r: 8 },
      { exId: "bench", w: 60, r: 10 },
    ]);
    expect(m.topWeight).toBe(80);
    expect(m.leastAssist).toBe(60);
    expect(m.volume).toBe(80 * 8 + 60 * 10);
    expect(m.e1rm).toBeCloseTo(epley1rm(80, 8));
    expect(m.maxReps).toBe(10);
    expect(m.totalReps).toBe(18);
  });

  test("leaves weight metrics undefined without weights", () => {
    const m = computeMetrics([{ exId: "x", w: null, r: 12 }]);
    expect(m.topWeight).toBeUndefined();
    expect(m.volume).toBeUndefined();
    expect(m.maxReps).toBe(12);
  });
});

describe("exerciseHistory", () => {
  const sessions = [
    session("c", "2026-09-30", [[{ exId: "bench", w: 85, r: 5 }]]),
    session("a", "2026-09-20", [[{ exId: "bench", w: 80, r: 8 }]]),
    session("b", "2026-09-25", [[{ exId: "bench", w: 75, r: 10 }]]),
    {
      id: "d",
      date: "2026-10-01",
      name: "Session",
      exercises: [
        {
          exerciseId: "dip",
          sets: [
            [
              { exId: "dip", w: 20, r: 8 },
              { exId: "bench", w: 90, r: 3 },
            ],
          ],
        },
      ],
    },
  ];

  test("orders oldest first and includes superset appearances", () => {
    const history = exerciseHistory(sessions, bench);
    expect(history.map((h) => h.sessionId)).toEqual(["a", "b", "c", "d"]);
    expect(history[3].sets).toEqual(["90×3"]);
  });

  test("flags sessions that beat every earlier headline value", () => {
    expect(exerciseHistory(sessions, bench).map((h) => h.isPr)).toEqual([false, false, true, true]);
  });

  test("bestOf returns the best value and first date reached", () => {
    const history = exerciseHistory(sessions, bench);
    expect(bestOf(history, "topWeight")).toEqual({ value: 90, date: "2026-10-01" });
    expect(bestOf(history, "totalReps")).toEqual({ value: 10, date: "2026-09-25" });
  });

  test("lower is better for assistance", () => {
    const dipSessions = [
      session("x", "2026-09-01", [[{ exId: "dip", w: 30, r: 8 }]]),
      session("y", "2026-09-08", [[{ exId: "dip", w: 20, r: 8 }]]),
    ];
    const history = exerciseHistory(dipSessions, dip);
    expect(history[1].isPr).toBe(true);
    expect(bestOf(history, "leastAssist")).toEqual({ value: 20, date: "2026-09-08" });
  });

  test("countSessionsUsing counts each workout once", () => {
    expect(countSessionsUsing(sessions, new Set(["bench"]))).toBe(4);
    expect(countSessionsUsing(sessions, new Set(["bench", "dip"]))).toBe(4);
    expect(countSessionsUsing(sessions, new Set(["nope"]))).toBe(0);
  });
});

describe("summaries", () => {
  test("bestSegment uses the type's headline", () => {
    const segs = [
      { exId: "bench", w: 80, r: 8 },
      { exId: "bench", w: 85, r: 3 },
    ];
    expect(bestSegment(segs, "weighted")).toEqual(segs[1]);
    expect(bestSegment(segs, "assisted")).toEqual(segs[0]);
    expect(bestSegment(segs, "bodyweight")).toEqual(segs[0]);
  });

  test("exerciseSummaries reports the latest session's best set", () => {
    const sessions = [
      session("a", "2026-09-20", [[{ exId: "bench", w: 100, r: 1 }]]),
      session("b", "2026-09-27", [
        [{ exId: "bench", w: 80, r: 8 }],
        [{ exId: "bench", w: 82.5, r: 6 }],
      ]),
    ];
    expect(exerciseSummaries(sessions, exercises).bench).toEqual({
      lastDate: "2026-09-27",
      lastBest: "82.5×6",
      sessionCount: 2,
    });
  });
});

describe("metric descriptions", () => {
  test("every non-obvious metric explains itself", () => {
    for (const key of ["e1rm", "volume", "leastAssist"] as const) {
      expect(METRIC_INFO[key].description?.length).toBeGreaterThan(0);
    }
  });
});
