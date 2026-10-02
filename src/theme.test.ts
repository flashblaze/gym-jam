import { describe, expect, test } from "vite-plus/test";

import { dark, primary } from "./theme";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Indices follow the token mapping in index.css.
const TEXT = { fg: dark[0], muted: dark[1], subtle: dark[2], faint: dark[3] };
const SURFACES = { page: dark[7], raised: dark[6], hover: dark[5] };
const ACCENT = primary[5];

describe("theme contrast (WCAG AA)", () => {
  for (const [textName, text] of Object.entries(TEXT)) {
    for (const [surfaceName, surface] of Object.entries(SURFACES)) {
      test(`${textName} text on ${surfaceName} surface is at least 4.5:1`, () => {
        expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  test("text on the accent is at least 4.5:1", () => {
    expect(contrast(SURFACES.page, ACCENT)).toBeGreaterThanOrEqual(4.5);
  });

  test("the accent as text on the page is at least 4.5:1", () => {
    expect(contrast(ACCENT, SURFACES.page)).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11: borders that identify a control need 3:1 against what surrounds them.
  test("control borders are at least 3:1 on the page and raised surfaces", () => {
    expect(contrast(dark[4], SURFACES.page)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark[4], SURFACES.raised)).toBeGreaterThanOrEqual(3);
  });
});
