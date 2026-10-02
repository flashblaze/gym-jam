import { afterEach, describe, expect, test } from "vite-plus/test";

import {
  REST_AUTO_CLEAR_MS,
  extendRestTimer,
  getRestTimer,
  isRestTimerExpired,
  parseRestTimer,
  restEndsAt,
  startRestTimer,
  stopRestTimer,
  subscribeRestTimer,
} from "./rest-timer";

afterEach(() => stopRestTimer());

describe("rest timer store", () => {
  test("start, extend and stop notify subscribers", () => {
    let calls = 0;
    const unsubscribe = subscribeRestTimer(() => calls++);
    startRestTimer(90, 1_000);
    extendRestTimer(30);
    expect(getRestTimer()).toEqual({ startedAt: 1_000, targetSeconds: 90, extraSeconds: 30 });
    stopRestTimer();
    expect(getRestTimer()).toBeNull();
    expect(calls).toBe(3);
    unsubscribe();
  });

  test("extending without a running timer does nothing", () => {
    extendRestTimer(30);
    expect(getRestTimer()).toBeNull();
  });
});

describe("expiry", () => {
  const state = { startedAt: 0, targetSeconds: 90, extraSeconds: 30 };

  test("a countdown ends after target plus extra", () => {
    expect(restEndsAt(state)).toBe(120_000);
    expect(restEndsAt({ ...state, targetSeconds: 0 })).toBe(0);
  });

  test("clears itself long after rest is over", () => {
    expect(isRestTimerExpired(state, 120_000 + REST_AUTO_CLEAR_MS)).toBe(false);
    expect(isRestTimerExpired(state, 120_000 + REST_AUTO_CLEAR_MS + 1)).toBe(true);
  });
});

describe("parseRestTimer", () => {
  test("accepts a stored timer and rejects anything else", () => {
    expect(parseRestTimer('{"startedAt":5,"targetSeconds":90,"extraSeconds":0}')).toEqual({
      startedAt: 5,
      targetSeconds: 90,
      extraSeconds: 0,
    });
    expect(parseRestTimer(null)).toBeNull();
    expect(parseRestTimer("{oops")).toBeNull();
    expect(parseRestTimer('{"startedAt":-1,"targetSeconds":90,"extraSeconds":0}')).toBeNull();
    expect(parseRestTimer('{"startedAt":"5","targetSeconds":90,"extraSeconds":0}')).toBeNull();
  });
});
