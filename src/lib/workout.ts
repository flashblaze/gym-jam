import type { Exercise, Segment, Session, WorkoutSet } from "~/db/index";

import { nanoid } from "./calc";
import { appendSet, emptySegment, isSetComplete, needsWeight } from "./sets";

type ExerciseType = Exercise["type"];
type ExercisesById = Record<string, Exercise>;

/**
 * In-progress workout. Only `done` sets are persisted (via `toSession`), so the stored
 * `Session` never contains incomplete segments. `key`s are UI-only identities.
 */
export interface DraftSet {
  key: string;
  segments: WorkoutSet;
  done: boolean;
}

export interface DraftBlock {
  key: string;
  exerciseId: string;
  sets: DraftSet[];
}

export interface WorkoutDraft {
  sessionId: string;
  date: string;
  name: string;
  blocks: DraftBlock[];
}

/** Name older versions stored for every workout; it means "unnamed". */
export const LEGACY_SESSION_NAME = "Session";

export function isUnnamedSession(name: string): boolean {
  const trimmed = name.trim();
  return trimmed === "" || trimmed === LEGACY_SESSION_NAME;
}

export function newDraftSet(segments: WorkoutSet, done = false): DraftSet {
  return { key: nanoid("set-"), segments, done };
}

export function draftFromSession(session: Session): WorkoutDraft {
  return {
    sessionId: session.id,
    date: session.date,
    name: session.name,
    blocks: session.exercises.map((block) => ({
      key: nanoid("blk-"),
      exerciseId: block.exerciseId,
      sets: block.sets.map((segments) => newDraftSet(segments, true)),
    })),
  };
}

export function emptyDraft(date: string): WorkoutDraft {
  return { sessionId: nanoid("s-"), date, name: "", blocks: [] };
}

/** The persisted form: done sets only, blocks without done sets dropped. */
export function toSession(draft: WorkoutDraft): Session {
  return {
    id: draft.sessionId,
    date: draft.date,
    name: draft.name,
    exercises: draft.blocks
      .map((block) => ({
        exerciseId: block.exerciseId,
        sets: block.sets.filter((set) => set.done).map((set) => set.segments),
      }))
      .filter((block) => block.sets.length > 0),
  };
}

/** Stable comparison key; `null` means "no session should be stored". */
export function sessionKey(session: Session | null): string | null {
  if (!session || session.exercises.length === 0) return null;
  return JSON.stringify([
    session.id,
    session.date,
    session.name,
    session.exercises.map((block) => [
      block.exerciseId,
      block.sets.map((set) => set.map((seg) => [seg.exId, seg.w, seg.r])),
    ]),
  ]);
}

function dropUnknownExercises(draft: WorkoutDraft, exercises: ExercisesById): WorkoutDraft {
  return {
    ...draft,
    blocks: draft.blocks
      .filter((block) => exercises[block.exerciseId])
      .map((block) => ({
        ...block,
        sets: block.sets
          .map((set) => ({ ...set, segments: set.segments.filter((seg) => exercises[seg.exId]) }))
          .filter((set) => set.segments.length > 0),
      })),
  };
}

/**
 * Picks the working copy for a page load. A saved draft wins only when it agrees with what is
 * stored (it then adds the unfinished rows), or when nothing is stored yet (it then recovers
 * done sets whose write was interrupted). Otherwise the stored session is the truth.
 */
export function resolveDraft(
  stored: Session | null,
  saved: WorkoutDraft | null,
  date: string,
  exercises: ExercisesById,
): WorkoutDraft {
  const fallback = stored ? draftFromSession(stored) : emptyDraft(date);
  if (!saved || saved.date !== date) return fallback;
  if (stored && saved.sessionId !== stored.id) return fallback;

  const cleaned = dropUnknownExercises(saved, exercises);
  if (!stored) return cleaned;
  return sessionKey(toSession(cleaned)) === sessionKey(stored) ? cleaned : fallback;
}

/**
 * Identifies which sets are ticked, ignoring their values. A change means a set was ticked,
 * unticked, deleted or restored, which is saved immediately; value edits can be batched.
 */
export function doneSetsSignature(draft: WorkoutDraft): string {
  return draft.blocks
    .map((block) => {
      const done = block.sets.filter((set) => set.done).map((set) => set.key);
      return `${block.key}:${done.join(",")}`;
    })
    .join("|");
}

export function countUnfinishedSets(draft: WorkoutDraft): number {
  return draft.blocks.reduce((n, block) => n + block.sets.filter((set) => !set.done).length, 0);
}

/** Drops unticked rows and blocks left without sets, i.e. keeps exactly what is persisted. */
export function discardUnfinished(draft: WorkoutDraft): WorkoutDraft {
  return {
    ...draft,
    blocks: draft.blocks
      .map((block) => ({ ...block, sets: block.sets.filter((set) => set.done) }))
      .filter((block) => block.sets.length > 0),
  };
}

export function updateBlock(
  draft: WorkoutDraft,
  blockKey: string,
  update: (block: DraftBlock) => DraftBlock,
): WorkoutDraft {
  return {
    ...draft,
    blocks: draft.blocks.map((block) => (block.key === blockKey ? update(block) : block)),
  };
}

export function updateDraftSet(
  draft: WorkoutDraft,
  blockKey: string,
  setKey: string,
  update: (set: DraftSet) => DraftSet,
): WorkoutDraft {
  return updateBlock(draft, blockKey, (block) => ({
    ...block,
    sets: block.sets.map((set) => (set.key === setKey ? update(set) : set)),
  }));
}

/** Editing a done set keeps it done only while it stays complete. */
export function withSegments(
  set: DraftSet,
  segments: WorkoutSet,
  exercises: ExercisesById,
): DraftSet {
  return { ...set, segments, done: set.done && isSetComplete(segments, exercises) };
}

export function appendDraftSet(block: DraftBlock, type: ExerciseType | undefined): DraftBlock {
  const next = appendSet(
    block.sets.map((set) => set.segments),
    block.exerciseId,
    type,
  );
  return { ...block, sets: [...block.sets, newDraftSet(next[next.length - 1])] };
}

export interface PreviousPerformance {
  sessionId: string;
  date: string;
  sets: WorkoutSet[];
}

/** Most recent block per exercise from sessions strictly before `date`. */
export function previousPerformances(
  sessions: Session[],
  date: string,
): Record<string, PreviousPerformance> {
  const result: Record<string, PreviousPerformance> = {};
  for (const sess of sessions) {
    if (sess.date >= date) continue;
    for (const block of sess.exercises) {
      const existing = result[block.exerciseId];
      if (!existing || sess.date > existing.date) {
        result[block.exerciseId] = { sessionId: sess.id, date: sess.date, sets: block.sets };
      }
    }
  }
  return result;
}

/** Exercise ids ordered by most recent use. */
export function recentExerciseIds(sessions: Session[], limit: number): string[] {
  const lastUsed = new Map<string, string>();
  for (const sess of sessions) {
    for (const block of sess.exercises) {
      const prev = lastUsed.get(block.exerciseId);
      if (!prev || sess.date > prev) lastUsed.set(block.exerciseId, sess.date);
    }
  }
  return [...lastUsed.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, limit)
    .map(([id]) => id);
}

export function newBlock(
  exerciseId: string,
  type: ExerciseType | undefined,
  previous: PreviousPerformance | undefined,
): DraftBlock {
  const count = Math.max(previous?.sets.length ?? 0, 1);
  return {
    key: nanoid("blk-"),
    exerciseId,
    sets: Array.from({ length: count }, () => newDraftSet([emptySegment(exerciseId, type)])),
  };
}

/** The previous segment at the same position, if it was the same exercise. */
export function hintFor(
  previous: PreviousPerformance | undefined,
  setIndex: number,
  segIndex: number,
  exId: string,
): Segment | undefined {
  if (!previous || previous.sets.length === 0) return undefined;
  const set = previous.sets[setIndex] ?? previous.sets[previous.sets.length - 1];
  const seg = set[segIndex];
  return seg?.exId === exId ? seg : undefined;
}

/** Fills fields the user left empty with last time's values. */
export function fillFromHint(
  seg: Segment,
  hint: Segment | undefined,
  type: ExerciseType | undefined,
): Segment {
  if (!hint) return seg;
  const emptyR = type === "timed" ? !seg.r : seg.r == null;
  return {
    ...seg,
    w: seg.w == null && needsWeight(type) ? hint.w : seg.w,
    r: emptyR ? hint.r : seg.r,
  };
}
