import { describe, expect, test } from "vite-plus/test";

import type { Session } from "~/db/index";

import { sessVolume } from "./calc";
import { formatWeekLabel, groupByWeek, weekStartOf } from "./history";

function session(id: string, date: string, w: number): Session {
  return {
    id,
    date,
    name: "Session",
    exercises: [{ exerciseId: "bench", sets: [[{ exId: "bench", w, r: 10 }]] }],
  };
}

describe("weekStartOf", () => {
  test("returns the Monday of the week", () => {
    expect(weekStartOf("2026-10-02")).toBe("2026-09-28"); // Friday
    expect(weekStartOf("2026-09-28")).toBe("2026-09-28"); // Monday
    expect(weekStartOf("2026-10-04")).toBe("2026-09-28"); // Sunday
  });
});

describe("groupByWeek", () => {
  test("groups newest-first sessions and totals each week", () => {
    const sessions = [
      session("a", "2026-10-02", 100),
      session("b", "2026-09-28", 50),
      session("c", "2026-09-27", 80),
    ];
    const groups = groupByWeek(sessions);
    expect(groups.map((g) => g.weekStart)).toEqual(["2026-09-28", "2026-09-21"]);
    expect(groups[0].sessions.map((s) => s.id)).toEqual(["a", "b"]);
    expect(groups[0].setCount).toBe(2);
    expect(groups[0].volume).toBe(sessVolume(sessions[0]) + sessVolume(sessions[1]));
  });
});

describe("formatWeekLabel", () => {
  const today = "2026-10-02";

  test("names the current and previous week", () => {
    expect(formatWeekLabel("2026-09-28", today)).toBe("This week");
    expect(formatWeekLabel("2026-09-21", today)).toBe("Last week");
  });

  test("shows a date range otherwise", () => {
    expect(formatWeekLabel("2026-09-07", today)).toBe("7–13 Sep");
    expect(formatWeekLabel("2026-08-31", today)).toBe("31 Aug – 6 Sep");
    expect(formatWeekLabel("2025-12-29", today)).toBe("29 Dec – 4 Jan");
    expect(formatWeekLabel("2025-09-01", today)).toBe("1–7 Sep 2025");
  });
});
