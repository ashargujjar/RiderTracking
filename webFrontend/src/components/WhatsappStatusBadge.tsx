import { useState, type MouseEvent } from "react";
import { CheckCircle2, X } from "lucide-react";

import { Spinner } from "./Spinner";

type WhatsappStatusBadgeProps = {
  sent: boolean;
  onMarkSent?: () => void;
  className?: string;
};

export function WhatsappStatusBadge({ sent, onMarkSent, className = "" }: WhatsappStatusBadgeProps) {
  const [isMarking, setIsMarking] = useState(false);

  if (sent) {
    return (
      <span
        className={`animate-scale-in flex items-center gap-1 text-xs font-semibold text-success ${className}`}
        title="Credentials sent via WhatsApp"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sent
      </span>
    );
  }

  if (!onMarkSent) {
    return (
      <span
        className={`flex items-center justify-center text-danger ${className}`}
        title="Not sent yet"
      >
        <X className="h-4 w-4" />
      </span>
    );
  }

  const handleMarkSent = (event: MouseEvent) => {
    event.stopPropagation();
    setIsMarking(true);
    setTimeout(() => {
      onMarkSent();
      setIsMarking(false);
    }, 400);
  };

  return (
    <button
      type="button"
      onClick={handleMarkSent}
      disabled={isMarking}
      title="Not sent yet — click to mark as sent"
      className={`flex cursor-pointer items-center justify-center text-danger transition hover:opacity-70 active:scale-90 disabled:cursor-not-allowed ${className}`}
    >
      {isMarking ? <Spinner className="h-3.5 w-3.5 border-2 border-danger/30 border-t-danger" /> : <X className="h-4 w-4" />}
    </button>
  );
}
