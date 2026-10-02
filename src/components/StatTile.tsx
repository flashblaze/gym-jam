import type { ReactNode } from "react";

import { cn } from "~/cn";

interface StatTileProps {
  label: string;
  value: ReactNode;
  caption?: string;
  /** Highlights the value in the accent colour. */
  accent?: boolean;
}

/** One cell of a hairline stat grid: `<dl className="grid … gap-px border border-line bg-line">`. */
const StatTile = ({ label, value, caption, accent = false }: StatTileProps) => (
  <div className="flex flex-col gap-1 bg-surface px-3 py-2">
    <dt className="order-2 text-xs font-bold uppercase tracking-[0.14em] text-fg-subtle">
      {label}
    </dt>
    <dd
      className={cn(
        "order-1 flex min-h-[30px] items-center font-display text-3xl leading-none font-bold tabular-nums",
        accent ? "text-primary-500" : "text-fg",
      )}
    >
      {value}
    </dd>
    {caption && (
      <dd className="order-3 text-xs font-semibold uppercase tracking-[0.08em] text-fg-faint">
        {caption}
      </dd>
    )}
  </div>
);

export default StatTile;
