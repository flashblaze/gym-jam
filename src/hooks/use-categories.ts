import { db } from "~/db/index";

import { createLiveCache, useCachedLiveQuery } from "./cached-live-query";

export const categoriesCache = createLiveCache(() => db.categories.orderBy("name").toArray());

export function useCategories() {
  return useCachedLiveQuery(categoriesCache);
}
