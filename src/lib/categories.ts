import type { Category } from "~/db/index";

/** Validation message for a new or renamed category, or `null` when the name is fine. */
export function validateCategoryName(
  name: string,
  categories: Category[],
  excludeId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a category name.";
  const clash = categories.find(
    (c) => c.id !== excludeId && c.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return clash ? `“${clash.name}” already exists.` : null;
}
