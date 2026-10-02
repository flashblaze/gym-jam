import { describe, expect, test } from "vite-plus/test";

import type { Exercise, Session } from "~/db/index";

import { emptySegment } from "./sets";
import {
  type WorkoutDraft,
  countUnfinishedSets,
  discardUnfinished,
  draftFromSession,
  fillFromHint,
  hintFor,
  newBlock,
  newDraftSet,
  previousPerformances,
  recentExerciseIds,
  resolveDraft,
  sessionKey,
  toSession,
  withSegments,
} from "./workout";

const bench: Exercise = { id: "bench", name: "Bench Press", category: "c", type: "weighted" };
const plank: Exercise = { id: "plank", name: "Plank", category: "c", type: "timed" };
const exercises = { bench, plank };

const stored: Session = {
  id: "s1",
  date: "2026-10-02",
  name: "Push",
  exercises: [{ exerciseId: "bench", sets: [[{ exId: "bench", w: 80, r: 8 }]] }],
};

function withPendingSet(draft: WorkoutDraft): WorkoutDraft {
  const [first, ...rest] = draft.blocks;
  return {
    ...draft,
    blocks: [
      { ...first, sets: [...first.sets, newDraftSet([emptySegment("bench", "weighted")])] },
      ...rest,
    ],
  };
}

describe("toSession / sessionKey", () => {
  test("persists only done sets and drops blocks without them", () => {
    const draft = withPendingSet(draftFromSession(stored));
    draft.blocks.push(newBlock("plank", "timed", undefined));
    expect(toSession(draft)).toEqual(stored);
  });

  test("an empty workout has no key", () => {
    expect(sessionKey({ ...stored, exercises: [] })).toBeNull();
    expect(sessionKey(null)).toBeNull();
    expect(sessionKey(toSession(draftFromSession(stored)))).toBe(sessionKey(stored));
  });
});

describe("resolveDraft", () => {
  test("uses the stored session when there is no saved draft", () => {
    expect(toSession(resolveDraft(stored, null, stored.date, exercises))).toEqual(stored);
  });

  test("keeps unfinished rows from a draft that agrees with storage", () => {
    const saved = withPendingSet(draftFromSession(stored));
    expect(resolveDraft(stored, saved, stored.date, exercises)).toEqual(saved);
  });

  test("discards a draft that disagrees with storage", () => {
    const saved = draftFromSession({ ...stored, name: "Changed elsewhere" });
    expect(resolveDraft(stored, saved, stored.date, exercises).name).toBe("Push");
  });

  test("discards a draft for a different session on the same date", () => {
    const saved = { ...draftFromSession(stored), sessionId: "other" };
    expect(resolveDraft(stored, saved, stored.date, exercises).sessionId).toBe("s1");
  });

  test("recovers done sets that never reached storage", () => {
    const saved = draftFromSession(stored);
    expect(toSession(resolveDraft(null, saved, stored.date, exercises))).toEqual(stored);
  });

  test("drops blocks and segments of deleted exercises", () => {
    const saved = draftFromSession(stored);
    const resolved = resolveDraft(null, saved, stored.date, { plank });
    expect(resolved.blocks).toEqual([]);
  });

  test("starts empty for a new date", () => {
    const resolved = resolveDraft(null, null, "2026-10-03", exercises);
    expect(resolved.date).toBe("2026-10-03");
    expect(resolved.blocks).toEqual([]);
  });
});

describe("withSegments", () => {
  test("un-marks a done set that becomes incomplete", () => {
    const set = newDraftSet([{ exId: "bench", w: 80, r: 8 }], true);
    expect(withSegments(set, [{ exId: "bench", w: 80, r: null }], exercises).done).toBe(false);
    expect(withSegments(set, [{ exId: "bench", w: 85, r: 8 }], exercises).done).toBe(true);
  });
});

describe("history helpers", () => {
  const sessions: Session[] = [
    { ...stored, id: "a", date: "2026-09-20" },
    {
      ...stored,
      id: "b",
      date: "2026-09-27",
      exercises: [
        {
          exerciseId: "bench",
          sets: [[{ exId: "bench", w: 85, r: 6 }], [{ exId: "bench", w: 85, r: 5 }]],
        },
      ],
    },
    { ...stored, id: "c", date: "2026-10-02" },
    {
      ...stored,
      id: "d",
      date: "2026-09-25",
      exercises: [{ exerciseId: "plank", sets: [[{ exId: "plank", w: null, r: 60 }]] }],
    },
  ];

  test("previousPerformances picks the latest block strictly before the date", () => {
    const prev = previousPerformances(sessions, "2026-10-02");
    expect(prev.bench.sessionId).toBe("b");
    expect(prev.plank.sessionId).toBe("d");
    expect(previousPerformances(sessions, "2026-09-20").bench).toBeUndefined();
  });

  test("recentExerciseIds orders by last use", () => {
    expect(recentExerciseIds(sessions, 5)).toEqual(["bench", "plank"]);
    expect(recentExerciseIds(sessions, 1)).toEqual(["bench"]);
  });

  test("newBlock pre-creates as many sets as last time", () => {
    const prev = previousPerformances(sessions, "2026-10-02");
    expect(newBlock("bench", "weighted", prev.bench).sets).toHaveLength(2);
    expect(newBlock("bench", "weighted", undefined).sets).toHaveLength(1);
  });

  test("hintFor falls back to the last set and ignores other exercises", () => {
    const prev = previousPerformances(sessions, "2026-10-02").bench;
    expect(hintFor(prev, 0, 0, "bench")).toEqual({ exId: "bench", w: 85, r: 6 });
    expect(hintFor(prev, 5, 0, "bench")).toEqual({ exId: "bench", w: 85, r: 5 });
    expect(hintFor(prev, 0, 0, "plank")).toBeUndefined();
    expect(hintFor(prev, 0, 1, "bench")).toBeUndefined();
  });
});

describe("fillFromHint", () => {
  test("fills only empty fields", () => {
    const hint = { exId: "bench", w: 85, r: 6 };
    expect(fillFromHint({ exId: "bench", w: null, r: null }, hint, "weighted")).toEqual(hint);
    expect(fillFromHint({ exId: "bench", w: 90, r: null }, hint, "weighted")).toEqual({
      exId: "bench",
      w: 90,
      r: 6,
    });
  });

  test("treats a zero duration as empty for timed exercises", () => {
    const hint = { exId: "plank", w: null, r: 60 };
    expect(fillFromHint(emptySegment("plank", "timed"), hint, "timed").r).toBe(60);
  });

  test("does not add weight to bodyweight exercises", () => {
    const hint = { exId: "x", w: 10, r: 12 };
    expect(fillFromHint({ exId: "x", w: null, r: null }, hint, "bodyweight").w).toBeNull();
  });
});

describe("finishing", () => {
  test("discardUnfinished keeps exactly what is persisted", () => {
    const draft = withPendingSet(draftFromSession(stored));
    draft.blocks.push(newBlock("plank", "timed", undefined));
    expect(countUnfinishedSets(draft)).toBe(2);

    const trimmed = discardUnfinished(draft);
    expect(countUnfinishedSets(trimmed)).toBe(0);
    expect(trimmed.blocks).toHaveLength(1);
    expect(toSession(trimmed)).toEqual(toSession(draft));
  });
});
