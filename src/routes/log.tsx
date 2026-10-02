import { createFileRoute, redirect } from "@tanstack/react-router";

import { isLoggableDate, todayIso } from "~/lib/calc";

/** Legacy entry point; logging now happens on the workout page. */
export const Route = createFileRoute("/log")({
  validateSearch: (search: Record<string, unknown>): { date?: string } =>
    isLoggableDate(search.date) ? { date: search.date } : {},
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/workout/$date", params: { date: search.date ?? todayIso() } });
  },
});
