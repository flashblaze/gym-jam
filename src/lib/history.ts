import dayjs from "dayjs";

import type { Session } from "~/db/index";

import { sessSetCount, sessVolume } from "./calc";

export interface WeekGroup {
  /** Monday of the week, "YYYY-MM-DD". */
  weekStart: string;
  sessions: Session[];
  setCount: number;
  volume: number;
}

export function weekStartOf(iso: string): string {
  const d = dayjs(iso);
  return d.subtract((d.day() + 6) % 7, "day").format("YYYY-MM-DD");
}

/** Groups sessions (already sorted newest first) into Monday-based weeks, newest first. */
export function groupByWeek(sessions: Session[]): WeekGroup[] {
  const groups: WeekGroup[] = [];
  for (const session of sessions) {
    const weekStart = weekStartOf(session.date);
    let group = groups[groups.length - 1];
    if (!group || group.weekStart !== weekStart) {
      group = { weekStart, sessions: [], setCount: 0, volume: 0 };
      groups.push(group);
    }
    group.sessions.push(session);
    group.setCount += sessSetCount(session);
    group.volume += sessVolume(session);
  }
  return groups;
}

export function formatWeekLabel(weekStart: string, today: string): string {
  const thisWeek = weekStartOf(today);
  if (weekStart === thisWeek) return "This week";
  if (weekStart === dayjs(thisWeek).subtract(1, "week").format("YYYY-MM-DD")) return "Last week";

  const start = dayjs(weekStart);
  const end = start.add(6, "day");
  const year = end.isSame(dayjs(today), "year") ? "" : ` ${end.year()}`;
  if (start.month() === end.month()) return `${start.date()}–${end.format("D MMM")}${year}`;
  return `${start.format("D MMM")} – ${end.format("D MMM")}${year}`;
}

export function formatSessionDate(iso: string): string {
  const d = dayjs(iso);
  return d.format(d.isSame(dayjs(), "year") ? "ddd, D MMM" : "ddd, D MMM YYYY");
}
