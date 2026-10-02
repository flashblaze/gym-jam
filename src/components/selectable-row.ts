import { cn } from "~/cn";

/** Classes for a tappable list row that can also be multi-selected. */
export function selectableRowClass(selectionMode: boolean, selected: boolean): string {
  return cn(
    "flex w-full select-none items-stretch border-b border-line transition-colors duration-150 [-webkit-touch-callout:none]",
    selectionMode && selected ? "bg-surface-hover" : "hover:bg-surface-raised",
  );
}
