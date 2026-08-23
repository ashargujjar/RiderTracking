import { ChevronRight, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { useSidebar } from "./SidebarContext";

type Breadcrumb = { label: string; to?: string };

type PageHeaderProps = {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
};

export function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  const { open } = useSidebar();

  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={open}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-dark transition hover:bg-background lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={crumb.label} className="flex items-center gap-1.5">
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray/60" />}
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className={`font-semibold transition-colors ${
                          isLast ? "text-primary" : "text-gray hover:text-primary hover:underline"
                        }`}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "font-semibold text-primary" : "font-semibold text-gray"}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          <h1 className="truncate text-lg font-bold text-text-darker">{title}</h1>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
