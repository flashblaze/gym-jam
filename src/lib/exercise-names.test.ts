import { describe, expect, test } from "vite-plus/test";

import type { Exercise } from "~/db/index";

import {
  RELATED_LIMIT,
  compareExerciseNames,
  findSimilarExercises,
  matchesExerciseQuery,
} from "./exercise-names";

describe("compareExerciseNames", () => {
  test.each([
    ["DB curl", "Dumbbell curls"],
    ["Lat pulldown close grip", "Close grip lat pulldown"],
    ["One-arm DB rows", "Single arm dumbbell rows"],
    ["Pushups", "Push-ups"],
    ["Pec flys", "Pec flies"],
    ["Seated rowing", "Seated rows"],
  ])("%s is exactly %s", (a, b) => {
    expect(compareExerciseNames(a, b)).toBe("exact");
  });

  test("keeps direction phrases ordered", () => {
    expect(
      compareExerciseNames("High to low cable crossover", "Low to high cable crossover"),
    ).not.toBe("exact");
  });

  // Duplicates actually found in real data.
  test.each([
    ["Flat bench", "Flat barbell bench press"],
    ["Lateral raises", "DB lateral raises"],
    ["Squats", "Bodyweight squats"],
  ])("%s is probably the same as %s", (a, b) => {
    expect(compareExerciseNames(a, b)).toBe("same");
  });

  // Variations kept separate in real data must never look like the same exercise.
  test.each([
    ["Cable lateral raises", "DB lateral raises"],
    ["Leg curl", "Single leg curl"],
    ["Incline barbell bench press", "Decline barbell bench press"],
    ["Hammer curls", "Rope hammer curls"],
    ["Triceps extensions", "Rope triceps extensions"],
    ["Reverse dumbbell flies", "Reverse pec flies"],
  ])("%s is not the same as %s", (a, b) => {
    expect(compareExerciseNames(a, b)).not.toBe("same");
    expect(compareExerciseNames(a, b)).not.toBe("exact");
  });

  test("unrelated names don't match", () => {
    expect(compareExerciseNames("Plank", "Leg press")).toBeNull();
  });
});

describe("findSimilarExercises", () => {
  const ex = (id: string, name: string): Exercise => ({
    id,
    name,
    category: "c",
    type: "weighted",
  });
  const library = [
    ex("a", "Dumbbell curls"),
    ex("b", "Dumbbell lateral raises"),
    ex("c", "Cable lateral raises"),
    ex("d", "Cable front raises"),
    ex("e", "Lateral raise machine"),
    ex("f", "Seated lateral raises"),
  ];

  test("finds an exact duplicate", () => {
    expect(findSimilarExercises("db curl", library).exact?.id).toBe("a");
  });

  test("separates probable duplicates from related names and caps related", () => {
    const result = findSimilarExercises("Lateral raises", library);
    expect(result.exact).toBeUndefined();
    expect(result.same.map((e) => e.id).sort()).toEqual(["b", "c", "e"]);
    expect(result.related.length).toBeLessThanOrEqual(RELATED_LIMIT);
    expect(result.related.map((e) => e.id)).toContain("f");
  });

  test("ignores the exercise being edited and empty names", () => {
    expect(findSimilarExercises("Dumbbell curls", library, "a").exact).toBeUndefined();
    expect(findSimilarExercises("  ", library)).toEqual({
      exact: undefined,
      same: [],
      related: [],
    });
  });
});

describe("matchesExerciseQuery", () => {
  test.each([
    ["Dumbbell curls", "db curl"],
    ["Close grip lat pulldown", "pulldown close"],
    ["Close grip lat pulldown", "close lat"],
    ["Dumbbell curls", "dumb"],
    ["Single arm dumbbell rows", "one arm row"],
    ["Push-ups", "pushup"],
  ])("%s matches %s", (name, query) => {
    expect(matchesExerciseQuery(name, query)).toBe(true);
  });

  test("rejects non-matches and accepts an empty query", () => {
    expect(matchesExerciseQuery("Dumbbell curls", "squat")).toBe(false);
    expect(matchesExerciseQuery("Dumbbell curls", "  ")).toBe(true);
  });
});
