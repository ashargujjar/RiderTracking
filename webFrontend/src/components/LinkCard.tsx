import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export type LinkCardTone = "primary" | "accent" | "warning" | "secondary" | "success";

type LinkCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: LinkCardTone;
  count?: number;
  onClick: () => void;
};

const TONE_STYLES: Record<LinkCardTone, { icon: string; ring: string }> = {
  primary: { icon: "bg-primary text-white", ring: "group-hover:border-primary" },
  accent: { icon: "bg-accent text-white", ring: "group-hover:border-accent" },
  warning: { icon: "bg-warning text-white", ring: "group-hover:border-warning" },
  secondary: { icon: "bg-secondary text-white", ring: "group-hover:border-secondary" },
  success: { icon: "bg-success text-white", ring: "group-hover:border-success" },
};

export function LinkCard({ title, description, icon: Icon, tone, count, onClick }: LinkCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full w-full cursor-pointer items-center gap-4 rounded-xl border-2 border-transparent bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] active:shadow-sm ${TONE_STYLES[tone].ring}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition group-hover:scale-105 ${TONE_STYLES[tone].icon}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-text-darker">{title}</p>
          {count !== undefined && (
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-text-dark">
              {count}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-gray transition group-hover:translate-x-1 group-hover:text-text-dark" />
    </button>
  );
}
