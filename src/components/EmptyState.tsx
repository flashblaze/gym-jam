import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

const EmptyState = ({ message, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
    <p className="max-w-xs text-sm font-semibold uppercase tracking-[0.08em] text-fg-subtle">
      {message}
    </p>
    {action}
  </div>
);

export default EmptyState;
