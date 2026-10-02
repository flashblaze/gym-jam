import { nanoid } from "~/lib/calc";
import { validateCategoryName } from "~/lib/categories";

import { type Category, db } from "./index";

async function assertValidName(name: string, excludeId?: string): Promise<string> {
  const error = validateCategoryName(name, await db.categories.toArray(), excludeId);
  if (error) throw new Error(error);
  return name.trim();
}

export async function addCategory(name: string): Promise<Category> {
  const category = { id: nanoid("cat-"), name: await assertValidName(name) };
  await db.categories.add(category);
  return category;
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await db.categories.update(id, { name: await assertValidName(name, id) });
}

/** Deletes a category, first moving its exercises to `moveTo` (required when it has any). */
export async function deleteCategory(id: string, moveTo: string | null): Promise<void> {
  await db.transaction("rw", [db.categories, db.exercises], async () => {
    const exerciseCount = await db.exercises.where("category").equals(id).count();
    if (exerciseCount > 0) {
      if (!moveTo || moveTo === id || !(await db.categories.get(moveTo))) {
        throw new Error("Choose another category for its exercises.");
      }
      await db.exercises.where("category").equals(id).modify({ category: moveTo });
    }
    await db.categories.delete(id);
  });
}
