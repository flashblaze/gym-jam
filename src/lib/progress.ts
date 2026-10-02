import type { Exercise, Segment, Session } from "~/db/index";

import { formatDuration, formatVolume } from "./calc";
import { formatSegmentValue } from "./sets";

type ExerciseType = Exercise["type"];

export type MetricKey =
  | "topWeight"
  | "e1rm"
  | "volume"
  | "leastAssist"
  | "maxReps"
  | "totalReps"
  | "bestTime"
  | "totalTime";

export interface MetricInfo {
  label: string;
  /** One-line plain-language explanation, shown behind an ⓘ. */
  description?: string;
  better: "higher" | "lower";
  format: (value: number) => string;
}

function formatKg(value: number): string {
  return `${Math.round(value * 10) / 10} kg`;
}

function formatReps(value: number): string {
  return `${value} reps`;
}

export const METRIC_INFO: Record<MetricKey, MetricInfo> = {
  topWeight: { label: "Top weight", better: "higher", format: formatKg },
  e1rm: {
    label: "Est. 1RM",
    description:
      "Estimated one-rep max: the heaviest single rep you could likely lift, worked out as weight × (1 + reps ÷ 30). It rises when you add reps, not just weight.",
    better: "higher",
    format: formatKg,
  },
  volume: {
    label: "Total lifted",
    description: "Weight × reps, added up over every set. Bodyweight and timed sets don't count.",
    better: "higher",
    format: formatVolume,
  },
  leastAssist: {
    label: "Least assist",
    description:
      "The lowest assistance weight you've used. Lower means you're lifting more of yourself.",
    better: "lower",
    format: formatKg,
  },
  maxReps: { label: "Best set", better: "higher", format: formatReps },
  totalReps: { label: "Total reps", better: "higher", format: formatReps },
  bestTime: { label: "Best time", better: "higher", format: formatDuration },
  totalTime: { label: "Total time", better: "higher", format: formatDuration },
};

/** The first metric of each type is its headline metric (PR badges, list summaries). */
export const METRICS_BY_TYPE: Record<ExerciseType, MetricKey[]> = {
  weighted: ["topWeight", "e1rm", "volume"],
  assisted: ["leastAssist", "maxReps", "totalReps"],
  bodyweight: ["maxReps", "totalReps"],
  timed: ["bestTime", "totalTime"],
};

/** Epley estimate; a single rep is the lift itself. */
export function epley1rm(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

export type MetricValues = Partial<Record<MetricKey, number>>;

function maxOf(values: number[]): number | undefined {
  return values.length ? Math.max(...values) : undefined;
}

function minOf(values: number[]): number | undefined {
  return values.length ? Math.min(...values) : undefined;
}

function sumOf(values: number[]): number | undefined {
  return values.length ? values.reduce((a, b) => a + b, 0) : undefined;
}

export function computeMetrics(segments: Segment[]): MetricValues {
  const weights = segments.flatMap((s) => (s.w != null ? [s.w] : []));
  const reps = segments.flatMap((s) => (s.r != null && s.r > 0 ? [s.r] : []));
  const loaded = segments.flatMap((s) =>
    s.w != null && s.r != null && s.r > 0 ? [{ w: s.w, r: s.r }] : [],
  );
  return {
    topWeight: maxOf(weights),
    leastAssist: minOf(weights),
    e1rm: maxOf(loaded.map(({ w, r }) => epley1rm(w, r))),
    volume: sumOf(loaded.map(({ w, r }) => w * r)),
    maxReps: maxOf(reps),
    totalReps: sumOf(reps),
    bestTime: maxOf(reps),
    totalTime: sumOf(reps),
  };
}

export interface SessionPerformance {
  sessionId: string;
  date: string;
  /** Each logged set's own segments, e.g. "80×8→60×6". */
  sets: string[];
  metrics: MetricValues;
  /** True when the headline metric beat every earlier session. */
  isPr: boolean;
}

function isBetter(metric: MetricKey, value: number, best: number): boolean {
  return METRIC_INFO[metric].better === "higher" ? value > best : value < best;
}

/** One entry per session that used the exercise (in any block), oldest first. */
export function exerciseHistory(sessions: Session[], exercise: Exercise): SessionPerformance[] {
  const headline = METRICS_BY_TYPE[exercise.type][0];
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const entries: SessionPerformance[] = [];
  let best: number | undefined;

  for (const sess of ordered) {
    const segments: Segment[] = [];
    const sets: string[] = [];
    for (const block of sess.exercises) {
      for (const set of block.sets) {
        const own = set.filter((seg) => seg.exId === exercise.id);
        if (own.length === 0) continue;
        segments.push(...own);
        sets.push(own.map((seg) => formatSegmentValue(seg, exercise.type)).join("→"));
      }
    }
    if (segments.length === 0) continue;

    const metrics = computeMetrics(segments);
    const value = metrics[headline];
    const isPr = value !== undefined && best !== undefined && isBetter(headline, value, best);
    if (value !== undefined && (best === undefined || isBetter(headline, value, best))) {
      best = value;
    }
    entries.push({ sessionId: sess.id, date: sess.date, sets, metrics, isPr });
  }
  return entries;
}

export interface MetricRecord {
  value: number;
  date: string;
}

/** Best value of a metric across the history, with the first date it was reached. */
export function bestOf(history: SessionPerformance[], metric: MetricKey): MetricRecord | null {
  let record: MetricRecord | null = null;
  for (const entry of history) {
    const value = entry.metrics[metric];
    if (value === undefined) continue;
    if (!record || isBetter(metric, value, record.value)) record = { value, date: entry.date };
  }
  return record;
}

/** The single most impressive segment of a set list, by the type's headline metric. */
export function bestSegment(segments: Segment[], type: ExerciseType): Segment | undefined {
  const score = (seg: Segment): number => {
    if (type === "weighted") return (seg.w ?? 0) * 1000 + (seg.r ?? 0);
    if (type === "assisted") return -(seg.w ?? Infinity) * 1000 + (seg.r ?? 0);
    return seg.r ?? 0;
  };
  let best: Segment | undefined;
  for (const seg of segments) {
    if (!best || score(seg) > score(best)) best = seg;
  }
  return best;
}

export interface ExerciseSummary {
  lastDate: string;
  /** Best segment of the most recent session, formatted (e.g. "80×8"). */
  lastBest: string | undefined;
  sessionCount: number;
}

export function exerciseSummaries(
  sessions: Session[],
  exercises: Record<string, Exercise>,
): Record<string, ExerciseSummary> {
  const latest: Record<string, { date: string; segments: Segment[]; sessionIds: Set<string> }> = {};
  for (const sess of sessions) {
    for (const block of sess.exercises) {
      for (const set of block.sets) {
        for (const seg of set) {
          const entry = (latest[seg.exId] ??= {
            date: sess.date,
            segments: [],
            sessionIds: new Set(),
          });
          entry.sessionIds.add(sess.id);
          if (sess.date > entry.date) {
            entry.date = sess.date;
            entry.segments = [];
          }
          if (sess.date === entry.date) entry.segments.push(seg);
        }
      }
    }
  }

  const result: Record<string, ExerciseSummary> = {};
  for (const [exId, { date, segments, sessionIds }] of Object.entries(latest)) {
    const type = exercises[exId]?.type;
    const top = type ? bestSegment(segments, type) : undefined;
    result[exId] = {
      lastDate: date,
      lastBest: top && type ? formatSegmentValue(top, type) : undefined,
      sessionCount: sessionIds.size,
    };
  }
  return result;
}

export function countSessionsUsing(sessions: Session[], exerciseIds: ReadonlySet<string>): number {
  return sessions.filter((sess) =>
    sess.exercises.some((block) =>
      block.sets.some((set) => set.some((seg) => exerciseIds.has(seg.exId))),
    ),
  ).length;
}
