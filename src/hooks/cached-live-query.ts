import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";

/** The last result of a shared live query, kept across screens. */
export interface LiveCache<T> {
  readonly query: () => Promise<T>;
  current(): T | undefined;
  remember(value: T): void;
}

export function createLiveCache<T>(query: () => Promise<T>): LiveCache<T> {
  let value: T | undefined;
  return {
    query,
    current: () => value,
    remember: (next) => {
      value = next;
    },
  };
}

/** Loads a cache once at startup so even the first visit to a screen renders with data. */
export function primeLiveCache<T>(cache: LiveCache<T>): void {
  cache
    .query()
    .then((value) => {
      if (cache.current() === undefined) cache.remember(value);
    })
    .catch(() => {
      // The live query on the screen will load (and report) it instead.
    });
}

/**
 * `useLiveQuery` that starts from the last known result, so returning to a screen renders
 * immediately instead of flashing a loading state; the live result replaces it right after.
 * Pass `fresh` where stale data must never be used (e.g. to seed state that gets saved).
 */
export function useCachedLiveQuery<T>(
  cache: LiveCache<T>,
  { fresh = false }: { fresh?: boolean } = {},
): T | undefined {
  const result = useLiveQuery(cache.query, [], fresh ? undefined : cache.current());
  useEffect(() => {
    if (result !== undefined) cache.remember(result);
  }, [cache, result]);
  return result;
}
