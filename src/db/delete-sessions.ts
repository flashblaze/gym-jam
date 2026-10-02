import { clearDraft, loadDraft } from "~/lib/workout-draft-storage";

import { type Session, db } from "./index";

/** Deletes sessions and any in-progress draft for them, so the draft cannot resurrect them. */
export async function deleteSessions(sessions: Session[]): Promise<void> {
  await db.sessions.bulkDelete(sessions.map((s) => s.id));
  for (const session of sessions) {
    if (loadDraft(session.date)?.sessionId === session.id) clearDraft(session.date);
  }
}
