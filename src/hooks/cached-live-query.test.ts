import { describe, expect, test } from "vite-plus/test";

import { createLiveCache, primeLiveCache } from "./cached-live-query";

describe("live cache", () => {
  test("remembers the latest value", () => {
    const cache = createLiveCache(async () => [1]);
    expect(cache.current()).toBeUndefined();
    cache.remember([2]);
    expect(cache.current()).toEqual([2]);
  });

  test("priming fills an empty cache but never overwrites a newer value", async () => {
    const empty = createLiveCache(async () => "loaded");
    primeLiveCache(empty);
    await Promise.resolve();
    await Promise.resolve();
    expect(empty.current()).toBe("loaded");

    const fresher = createLiveCache(async () => "stale");
    primeLiveCache(fresher);
    fresher.remember("live");
    await Promise.resolve();
    await Promise.resolve();
    expect(fresher.current()).toBe("live");
  });
});
