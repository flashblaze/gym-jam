import { createFileRoute, redirect } from "@tanstack/react-router";

import { todayIso } from "~/lib/calc";

export const Route = createFileRoute("/workout/")({
  beforeLoad: () => {
    throw redirect({ to: "/workout/$date", params: { date: todayIso() } });
  },
});
