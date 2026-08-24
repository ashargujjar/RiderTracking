import type { ReactNode } from "react";

export type ContainerWidth = "hub" | "wide-table" | "compact" | "detail" | "search-single" | "search-list" | "form";

const WIDTH_STYLES: Record<ContainerWidth, string> = {
  hub: "max-w-6xl",
  "wide-table": "max-w-5xl",
  compact: "max-w-4xl",
  detail: "max-w-6xl",
  "search-single": "max-w-2xl",
  "search-list": "max-w-3xl",
  form: "max-w-2xl",
};

type PageContainerProps = {
  width: ContainerWidth;
  children: ReactNode;
};

export function PageContainer({ width, children }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`animate-fade-in-up mx-auto w-full px-6 py-10 ${WIDTH_STYLES[width]}`}>{children}</div>
    </div>
  );
}
