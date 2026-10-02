import type { ReactNode } from "react";

import { cn } from "~/cn";

interface SectionHeadingProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

const SectionHeading = ({ id, className, children }: SectionHeadingProps) => (
  <h2
    id={id}
    className={cn(
      "font-display text-lg font-bold uppercase tracking-[0.06em] text-fg-muted",
      className,
    )}
  >
    {children}
  </h2>
);

export default SectionHeading;
