import { type Session } from "../../db";
import { type SessionSegmentRow } from "./schemas";

// Prefix with block index so duplicate exercises in the same session round-trip correctly.
export function encodeBlockExId(blockIdx: number, exerciseId: string): string {
  return `${blockIdx}_${exerciseId}`;
}

// Strips the block-index prefix added by encodeBlockExId.
export function decodeBlockExId(blockExerciseId: string): string {
  const underscoreIdx = blockExerciseId.indexOf("_");
  return underscoreIdx !== -1 ? blockExerciseId.slice(underscoreIdx + 1) : blockExerciseId;
}

export function sessionsToRows(sessions: Session[]): SessionSegmentRow[] {
  const rows: SessionSegmentRow[] = [];

  for (const session of sessions) {
    for (const [blockIdx, block] of session.exercises.entries()) {
      for (const [setIdx, set] of block.sets.entries()) {
        for (const [segIdx, segment] of set.entries()) {
          rows.push({
            sessionId: session.id,
            sessionDate: session.date,
            sessionName: session.name,
            blockExerciseId: encodeBlockExId(blockIdx, block.exerciseId),
            setIndex: setIdx,
            segmentIndex: segIdx,
            segmentExId: segment.exId,
            weight: segment.w,
            repsOrSeconds: segment.r,
          });
        }
      }
    }
  }

  return rows;
}

export function rowsToSessions(rows: SessionSegmentRow[]): Session[] {
  const sessionMap = new Map<
    string,
    {
      id: string;
      date: string;
      name: string;
      exercises: Map<string, Map<number, SessionSegmentRow[]>>;
    }
  >();

  for (const row of rows) {
    if (!sessionMap.has(row.sessionId)) {
      sessionMap.set(row.sessionId, {
        id: row.sessionId,
        date: row.sessionDate,
        name: row.sessionName,
        exercises: new Map(),
      });
    }

    const sessionMeta = sessionMap.get(row.sessionId)!;
    if (!sessionMeta.exercises.has(row.blockExerciseId)) {
      sessionMeta.exercises.set(row.blockExerciseId, new Map());
    }

    const setsMap = sessionMeta.exercises.get(row.blockExerciseId)!;
    if (!setsMap.has(row.setIndex)) {
      setsMap.set(row.setIndex, []);
    }

    setsMap.get(row.setIndex)!.push(row);
  }

  const sessions: Session[] = [];

  for (const sessionMeta of sessionMap.values()) {
    const exercises = Array.from(sessionMeta.exercises.entries()).map(
      ([blockExerciseId, setsMap]) => {
        const exerciseId = decodeBlockExId(blockExerciseId);

        const sets = Array.from(setsMap.entries())
          .sort(([idxA], [idxB]) => idxA - idxB)
          .map(([, segments]) =>
            segments
              .sort((a, b) => a.segmentIndex - b.segmentIndex)
              .map((seg) => ({ exId: seg.segmentExId, w: seg.weight, r: seg.repsOrSeconds })),
          );

        return { exerciseId, sets };
      },
    );

    sessions.push({
      id: sessionMeta.id,
      date: sessionMeta.date,
      name: sessionMeta.name,
      exercises,
    });
  }

  return sessions;
}
