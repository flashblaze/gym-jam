import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useRef, useState } from "react";

import { db } from "~/db/index";
import { type WorkoutDraft, doneSetsSignature, sessionKey, toSession } from "~/lib/workout";
import { clearDraft, saveDraft } from "~/lib/workout-draft-storage";

const WRITE_DELAY_MS = 400;
// Forces the next flush to retry after a failed write.
const FAILED_WRITE = "failed";

/**
 * Mirrors the draft to localStorage on every change and writes its done sets to IndexedDB
 * (one put/delete per write; immediate for tick changes, debounced for edits, and flushed when
 * the app is hidden, the page is left or the editor unmounts).
 */
export type SaveStatus = "saved" | "saving" | "error";

export function useWorkoutPersistence(draft: WorkoutDraft, storedKey: string | null) {
  const lastWrittenKey = useRef<string | null>(storedKey);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(storedKey);
  const [failed, setFailed] = useState(false);
  const latest = useRef(draft);
  const lastSignature = useRef(doneSetsSignature(draft));
  const disposed = useRef(false);

  const flush = useCallback(() => {
    if (disposed.current) return;
    const session = toSession(latest.current);
    const key = sessionKey(session);
    if (key === lastWrittenKey.current) return;
    lastWrittenKey.current = key;
    const write = async () => {
      if (key === null) await db.sessions.delete(session.id);
      else await db.sessions.put(session);
    };
    write()
      .then(() => {
        setConfirmedKey(key);
        setFailed(false);
      })
      .catch((err: unknown) => {
        lastWrittenKey.current = FAILED_WRITE;
        setFailed(true);
        notifications.show({
          title: "Save failed",
          message: err instanceof Error ? err.message : "Could not save the workout.",
          color: "red",
        });
      });
  }, []);

  useEffect(() => {
    latest.current = draft;
    if (draft.blocks.length > 0) saveDraft(draft);
    else clearDraft(draft.date);

    // Ticks, unticks, deletes and undos are written at once so a reload or killed app can't
    // lose them; typing into a done set or renaming is batched.
    const signature = doneSetsSignature(draft);
    if (signature !== lastSignature.current) {
      lastSignature.current = signature;
      flush();
      return;
    }
    const timer = setTimeout(flush, WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, flush]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) flush();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    // Fires on reload and navigation away, where visibilitychange may not (best effort).
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  /** Stops all further writes (used right before the session is deleted). */
  const dispose = useCallback(() => {
    disposed.current = true;
  }, []);

  const currentKey = sessionKey(toSession(draft));
  const status: SaveStatus = failed ? "error" : currentKey === confirmedKey ? "saved" : "saving";

  return { dispose, status };
}
