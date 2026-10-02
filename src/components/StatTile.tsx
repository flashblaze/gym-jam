import type { ReactNode } from "react";

import { cn } from "~/cn";

import InfoHint from "./InfoHint";

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Shown smaller after the value, e.g. "kg". */
  unit?: string;
  caption?: string;
  /** Explanation behind an ⓘ next to the label. */
  info?: string;
  /** Highlights the value in the accent colour. */
  accent?: boolean;
}

// Values this long (e.g. "6,073") drop a size so they fit a third of a phone's width.
const LONG_VALUE_CHARS = 5;

/** One cell of a hairline stat grid: `<dl className="grid … gap-px border border-line bg-line">`. */
const StatTile = ({ label, value, unit, caption, info, accent = false }: StatTileProps) => {
  const isLong =
    (typeof value === "string" || typeof value === "number") &&
    String(value).length >= LONG_VALUE_CHARS;

  return (
    <div className="flex min-w-0 flex-col gap-1 bg-surface px-3 py-2">
      <dt className="order-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-fg-subtle">
        {label}
        {info && <InfoHint term={label}>{info}</InfoHint>}
      </dt>
      <dd
        className={cn(
          "order-1 flex min-h-[30px] items-baseline whitespace-nowrap font-display leading-none font-bold tabular-nums",
          isLong ? "text-2xl" : "text-3xl",
          accent ? "text-primary-500" : "text-fg",
        )}
      >
        {value}
        {unit && <span className="ml-1 text-base font-semibold text-fg-subtle">{unit}</span>}
      </dd>
      {caption && (
        <dd className="order-3 text-xs font-semibold uppercase tracking-[0.08em] text-fg-faint">
          {caption}
        </dd>
      )}
    </div>
  );
};

export default StatTile;
