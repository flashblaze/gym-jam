import { describe, expect, test } from "vite-plus/test";

import { RELOAD_GUARD_MS, shouldReloadAfterChunkError } from "./chunk-reload";

describe("shouldReloadAfterChunkError", () => {
  test("reloads on the first failure", () => {
    expect(shouldReloadAfterChunkError(1_000, null)).toBe(true);
  });

  test("does not loop when the reload just happened", () => {
    expect(shouldReloadAfterChunkError(5_000, 5_000 - RELOAD_GUARD_MS + 1)).toBe(false);
  });

  test("reloads again once the guard window has passed", () => {
    expect(shouldReloadAfterChunkError(50_000, 50_000 - RELOAD_GUARD_MS)).toBe(true);
  });
});
