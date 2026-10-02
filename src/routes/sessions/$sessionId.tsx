import { createFileRoute, redirect } from "@tanstack/react-router";

import { db } from "~/db/index";

/** Legacy entry point; sessions are viewed and edited on the workout page. */
export const Route = createFileRoute("/sessions/$sessionId")({
  beforeLoad: async ({ params }) => {
    const session = await db.sessions.get(params.sessionId);
    if (!session) throw redirect({ to: "/sessions" });
    throw redirect({
      to: "/workout/$date",
      params: { date: session.date },
      search: { session: session.id },
    });
  },
});
