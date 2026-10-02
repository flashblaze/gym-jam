import type { Exercise } from "~/db/index";

// Multi-word spellings collapsed to one token. Direction phrases stay ordered so
// "High to low cable crossovers" never equals "Low to high cable crossovers".
const PHRASES: [RegExp, string][] = [
  [/\bhigh to low\b/g, "high2low"],
  [/\blow to high\b/g, "low2high"],
  [/\b(?:one|1|single)[\s-]?arm\b/g, "single arm"],
  [/\b(?:one|1|single)[\s-]?leg\b/g, "single leg"],
  [/\bpush[\s-]?ups?\b/g, "pushup"],
  [/\bpull[\s-]?ups?\b/g, "pullup"],
  [/\bchin[\s-]?ups?\b/g, "chinup"],
  [/\bpull[\s-]?downs?\b/g, "pulldown"],
  [/\bstep[\s-]?ups?\b/g, "stepup"],
];

const SYNONYMS: Record<string, string> = {
  db: "dumbbell",
  dbs: "dumbbell",
  bb: "barbell",
  kb: "kettlebell",
  ez: "ezbar",
  ohp: "overhead press",
  rdl: "romanian deadlift",
  bicep: "biceps",
  tricep: "triceps",
  flys: "fly",
  flyes: "fly",
  flies: "fly",
  rowing: "row",
  pecs: "pec",
};

// Words whose trailing "s" is not a plural.
const NOT_PLURAL = new Set(["press", "biceps", "triceps", "cross", "abs"]);
const FILLER = new Set(["with", "the", "a", "on"]);

/** Words that say which equipment, not which movement. */
const EQUIPMENT = new Set([
  "barbell",
  "dumbbell",
  "bodyweight",
  "cable",
  "machine",
  "kettlebell",
  "ezbar",
  "smith",
  "band",
]);
/** Words whose absence doesn't change the movement ("Flat bench" = "Flat bench press"). */
const GENERIC = new Set(["press", "exercise"]);

export const RELATED_LIMIT = 3;

function singular(word: string): string {
  if (NOT_PLURAL.has(word) || word.length <= 3 || !word.endsWith("s")) return word;
  return word.slice(0, -1);
}

/** The words of a name in canonical form: case, punctuation, abbreviations, plurals and order ignored. */
export function exerciseNameTokens(name: string): Set<string> {
  let text = name.toLowerCase();
  for (const [pattern, replacement] of PHRASES) text = text.replace(pattern, replacement);
  const tokens = new Set<string>();
  for (const raw of text.match(/[a-z0-9]+/g) ?? []) {
    for (const word of (SYNONYMS[raw] ?? raw).split(" ")) {
      if (!FILLER.has(word)) tokens.add(singular(word));
    }
  }
  return tokens;
}

/**
 * - `exact`: the same name written differently ("DB curl" / "Dumbbell curls").
 * - `same`: one name is a less specific version of the other, differing only by equipment or
 *   generic words that don't conflict ("Lateral raises" / "Dumbbell lateral raises").
 * - `related`: shares at least two words; a hint, often a deliberate variation.
 */
export type NameMatch = "exact" | "same" | "related";

function isSubset(a: Set<string>, b: Set<string>): boolean {
  for (const word of a) if (!b.has(word)) return false;
  return true;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared++;
  return shared;
}

function classify(a: Set<string>, b: Set<string>): NameMatch | null {
  const shared = overlap(a, b);
  if (shared === a.size && shared === b.size) return "exact";

  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  if (isSubset(small, big)) {
    const extra = [...big].filter((word) => !small.has(word));
    const onlyEquipmentOrGeneric = extra.every((w) => EQUIPMENT.has(w) || GENERIC.has(w));
    const conflictingEquipment =
      [...small].some((w) => EQUIPMENT.has(w)) && extra.some((w) => EQUIPMENT.has(w));
    if (onlyEquipmentOrGeneric && !conflictingEquipment) return "same";
  }
  return shared >= 2 ? "related" : null;
}

export function compareExerciseNames(a: string, b: string): NameMatch | null {
  return classify(exerciseNameTokens(a), exerciseNameTokens(b));
}

export interface SimilarExercises {
  exact: Exercise | undefined;
  same: Exercise[];
  related: Exercise[];
}

/** Existing exercises that a new or renamed exercise called `name` may duplicate. */
export function findSimilarExercises(
  name: string,
  exercises: Exercise[],
  excludeId?: string,
): SimilarExercises {
  const result: SimilarExercises = { exact: undefined, same: [], related: [] };
  const tokens = exerciseNameTokens(name);
  if (tokens.size === 0) return result;

  const related: { exercise: Exercise; score: number }[] = [];
  for (const exercise of exercises) {
    if (exercise.id === excludeId) continue;
    const other = exerciseNameTokens(exercise.name);
    const match = classify(tokens, other);
    if (match === "exact") result.exact ??= exercise;
    else if (match === "same") result.same.push(exercise);
    else if (match === "related") {
      const shared = overlap(tokens, other);
      related.push({ exercise, score: shared / (tokens.size + other.size - shared) });
    }
  }
  result.related = related
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, RELATED_LIMIT)
    .map((r) => r.exercise);
  return result;
}

/** Search that understands abbreviations and word order: "db curl" finds "Dumbbell curls". */
export function matchesExerciseQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  const nameTokens = [...exerciseNameTokens(name)];
  const queryTokens = exerciseNameTokens(q);
  if (queryTokens.size === 0) return false;
  for (const word of queryTokens) {
    if (!nameTokens.some((token) => token.startsWith(word))) return false;
  }
  return true;
}
