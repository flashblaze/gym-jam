import { useLiveQuery } from "dexie-react-hooks";

import { db } from "~/db/index";

export function useCategories() {
  return useLiveQuery(() => db.categories.orderBy("name").toArray(), []);
}
