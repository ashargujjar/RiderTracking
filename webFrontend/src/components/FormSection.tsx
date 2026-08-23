import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type FormSectionTone = "primary" | "success" | "secondary";

type FormSectionProps = {
  title: string;
  icon?: LucideIcon;
  tone?: FormSectionTone;
  id?: string;
  children: ReactNode;
};

const TONE_STYLES: Record<FormSectionTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  secondary: "bg-secondary",
};

export function FormSection({ title, icon: Icon, tone = "primary", id, children }: FormSectionProps) {
  return (
    <div id={id} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className={`flex items-center justify-center gap-2 px-6 py-3 ${TONE_STYLES[tone]}`}>
        {Icon && <Icon className="h-4 w-4 text-white" />}
        <h2 className="text-center text-sm font-bold tracking-wide text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
