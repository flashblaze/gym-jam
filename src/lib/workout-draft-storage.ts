import dayjs from "dayjs";

import type { WorkoutDraft } from "./workout";

const PREFIX = "workout-draft:";
const MAX_AGE_DAYS = 30;

function draftKey(date: string): string {
  return PREFIX + date;
}

function isWorkoutDraft(value: unknown): value is WorkoutDraft {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<WorkoutDraft>;
  return (
    typeof v.sessionId === "string" &&
    typeof v.date === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.blocks)
  );
}

export function loadDraft(date: string): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(date));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isWorkoutDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: WorkoutDraft): void {
  try {
    localStorage.setItem(draftKey(draft.date), JSON.stringify(draft));
  } catch {
    // Storage unavailable or full: the done sets are still persisted in IndexedDB.
  }
}

export function clearDraft(date: string): void {
  try {
    localStorage.removeItem(draftKey(date));
  } catch {
    // Ignore: nothing to clear.
  }
}

function draftKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

export function clearAllDrafts(): void {
  try {
    for (const key of draftKeys()) localStorage.removeItem(key);
  } catch {
    // Ignore: nothing to clear.
  }
}

export function pruneOldDrafts(): void {
  try {
    const cutoff = dayjs().subtract(MAX_AGE_DAYS, "day").format("YYYY-MM-DD");
    for (const key of draftKeys()) {
      if (key.slice(PREFIX.length) < cutoff) localStorage.removeItem(key);
    }
  } catch {
    // Ignore: pruning is best-effort.
  }
}
