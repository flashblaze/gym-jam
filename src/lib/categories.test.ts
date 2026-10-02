import { describe, expect, test } from "vite-plus/test";

import { validateCategoryName } from "./categories";

const categories = [
  { id: "biceps", name: "Biceps" },
  { id: "legs", name: "Legs" },
];

describe("validateCategoryName", () => {
  test("accepts a new unique name", () => {
    expect(validateCategoryName("Core", categories)).toBeNull();
  });

  test("rejects empty and duplicate names, ignoring case and spaces", () => {
    expect(validateCategoryName("  ", categories)).not.toBeNull();
    expect(validateCategoryName(" biceps ", categories)).toContain("Biceps");
  });

  test("allows keeping a category's own name when renaming", () => {
    expect(validateCategoryName("Legs", categories, "legs")).toBeNull();
  });
});
