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

export function formatVolume(kg: number): string {
  if (kg >= 1000) return (kg / 1000).toFixed(1) + "t";
  return Math.round(kg) + " kg";
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
  return new Date().toISOString().slice(0, 10);
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
