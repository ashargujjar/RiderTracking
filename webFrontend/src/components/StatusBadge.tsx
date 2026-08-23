import { STATUS_TONE_STYLES, type StatusTone } from "../data/statusStyles";

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
  className?: string;
};

export function StatusBadge({ label, tone, className = "" }: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE_STYLES[tone]} ${className}`}>
      {label}
    </span>
  );
}
