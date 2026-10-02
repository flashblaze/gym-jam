import { describe, expect, test } from "vite-plus/test";

import { formatKgAmount, formatVolume } from "./calc";

describe("formatVolume", () => {
  test("shows whole kilograms with the unit", () => {
    expect(formatVolume(775)).toBe("775 kg");
    expect(formatVolume(640.4)).toBe("640 kg");
  });

  test("groups thousands instead of switching to tonnes", () => {
    // Separator depends on the runtime locale (",", ".", " " …), so only its presence is checked.
    expect(formatKgAmount(2035)).toMatch(/^2\D?035$/);
    expect(formatVolume(2035)).toMatch(/^2\D?035 kg$/);
  });
});
