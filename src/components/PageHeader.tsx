import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header className="flex items-start justify-between gap-3 px-4 pt-6 pb-3">
    <div className="min-w-0">
      <h1 className="font-display text-[44px] leading-[0.9] font-extrabold uppercase text-fg">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-fg-subtle">
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>}
  </header>
);

export default PageHeader;
