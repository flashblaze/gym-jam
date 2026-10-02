import { db } from "~/db/index";

import { createLiveCache, useCachedLiveQuery } from "./cached-live-query";

export const sessionsCache = createLiveCache(() => db.sessions.orderBy("date").reverse().toArray());

export function useSessions() {
  return useCachedLiveQuery(sessionsCache);
}
