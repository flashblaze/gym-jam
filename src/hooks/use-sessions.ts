import { useLiveQuery } from "dexie-react-hooks";

import { db } from "~/db/index";

export function useSessions() {
  return useLiveQuery(() => db.sessions.orderBy("date").reverse().toArray(), []);
}
