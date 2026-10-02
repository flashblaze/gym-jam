export interface RestTimerState {
  startedAt: number;
  /** Countdown length in seconds; 0 counts up. */
  targetSeconds: number;
  /** Added with "+30". */
  extraSeconds: number;
}

const STORAGE_KEY = "gym-jam:rest-timer";
/** A finished (or count-up) timer nobody dismissed clears itself after this long. */
export const REST_AUTO_CLEAR_MS = 10 * 60 * 1000;

function isNonNegative(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

/** sessionStorage is user-editable, so a stored timer is validated before use. */
export function parseRestTimer(raw: string | null): RestTimerState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const startedAt = "startedAt" in value ? value.startedAt : undefined;
    const targetSeconds = "targetSeconds" in value ? value.targetSeconds : undefined;
    const extraSeconds = "extraSeconds" in value ? value.extraSeconds : undefined;
    if (
      !isNonNegative(startedAt) ||
      !isNonNegative(targetSeconds) ||
      !isNonNegative(extraSeconds)
    ) {
      return null;
    }
    return { startedAt, targetSeconds, extraSeconds };
  } catch {
    return null;
  }
}

/** When the countdown ends (epoch ms); for a count-up timer, when it started. */
export function restEndsAt(state: RestTimerState): number {
  return (
    state.startedAt +
    (state.targetSeconds > 0 ? state.targetSeconds + state.extraSeconds : 0) * 1000
  );
}

export function isRestTimerExpired(state: RestTimerState, now: number): boolean {
  return now - restEndsAt(state) > REST_AUTO_CLEAR_MS;
}

function readStored(): RestTimerState | null {
  try {
    return parseRestTimer(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

let current: RestTimerState | null = readStored();
const listeners = new Set<() => void>();

function set(next: RestTimerState | null): void {
  current = next;
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // In-memory state still drives the UI for this page load.
  }
  for (const listener of listeners) listener();
}

export function getRestTimer(): RestTimerState | null {
  return current;
}

export function subscribeRestTimer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startRestTimer(targetSeconds: number, now = Date.now()): void {
  set({ startedAt: now, targetSeconds, extraSeconds: 0 });
}

export function extendRestTimer(seconds: number): void {
  if (current) set({ ...current, extraSeconds: current.extraSeconds + seconds });
}

export function stopRestTimer(): void {
  set(null);
}
