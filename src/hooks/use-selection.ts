import { useState } from "react";

/** Multi-select state for lists with a selection mode (entered via button or long-press). */
export function useSelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Enters selection mode with `id` selected (long-press). */
  const startWith = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => new Set(prev).add(id));
  };

  const enter = () => setSelectionMode(true);

  const exit = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  return { selectionMode, selectedIds, toggle, startWith, enter, exit };
}
