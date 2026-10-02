import dayjs from "dayjs";

import type { Session } from "~/db/index";

export function sessVolume(sess: Session): number {
  let v = 0;
  for (const ex of sess.exercises) {
    for (const set of ex.sets) {
      for (const seg of set) {
        if (seg.w != null && seg.r != null) v += seg.w * seg.r;
      }
    }
  }
  return v;
}

export function sessSetCount(sess: Session): number {
  let c = 0;
  for (const ex of sess.exercises) c += ex.sets.length;
  return c;
}

// User's locale, so grouping matches their phone (e.g. 2,035 or 2.035).
const WHOLE_KG = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** Whole kilograms with digit grouping, no unit: "2,035". */
export function formatKgAmount(kg: number): string {
  return WHOLE_KG.format(kg);
}

/** Total weight moved (weight × reps summed), e.g. "2,035 kg". */
export function formatVolume(kg: number): string {
  return `${formatKgAmount(kg)} kg`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return d.getDate() + " " + months[d.getMonth()];
}

export function todayIso(): string {
  return dayjs().format("YYYY-MM-DD");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in "YYYY-MM-DD" form that is not in the future. */
export function isLoggableDate(raw: unknown): raw is string {
  if (typeof raw !== "string" || !ISO_DATE.test(raw)) return false;
  const d = dayjs(raw);
  return d.isValid() && d.format("YYYY-MM-DD") === raw && !d.isAfter(dayjs(), "day");
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function nanoid(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
