import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  variant?: "card" | "inline";
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  variant = "card",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const wrapperClassName =
    variant === "card"
      ? "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-white p-8 text-center"
      : "flex flex-col items-center gap-1 py-6 text-center";

  return (
    <div className={wrapperClassName}>
      {Icon && <Icon className="h-6 w-6 text-gray" />}
      <p className={variant === "card" ? "text-sm font-semibold text-text-darker" : "text-sm text-gray"}>{title}</p>
      {description && <p className="text-sm text-gray">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 cursor-pointer text-sm font-semibold text-primary hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
