import { useSyncExternalStore } from "react";

import { getRestTimer, subscribeRestTimer } from "~/lib/rest-timer";

/** The running rest timer, shared by every page; `null` when none is running. */
export function useRestTimer() {
  return useSyncExternalStore(subscribeRestTimer, getRestTimer);
}
