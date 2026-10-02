import { describe, expect, test } from "vite-plus/test";

import { DEFAULT_PREFERENCES, REST_PRESETS, parsePreferences } from "./use-preferences";

describe("parsePreferences", () => {
  test("reads a valid stored value", () => {
    expect(
      parsePreferences(JSON.stringify({ restTimerEnabled: false, restSeconds: REST_PRESETS[0] })),
    ).toEqual({ restTimerEnabled: false, restSeconds: REST_PRESETS[0] });
  });

  test("falls back to defaults for missing, corrupt, or out-of-range values", () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("{not json")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("null")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ restSeconds: -5 }))).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ restSeconds: "90" }))).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ restTimerEnabled: "no" }))).toEqual(
      DEFAULT_PREFERENCES,
    );
  });
});
