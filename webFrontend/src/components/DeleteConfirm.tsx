import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Spinner } from "./Spinner";

type DeleteConfirmProps = {
  itemLabel: string;
  onConfirm: () => void;
  variant?: "row" | "panel";
  panelTitle?: string;
  panelDescription?: string;
};

export function DeleteConfirm({
  itemLabel,
  onConfirm,
  variant = "row",
  panelTitle,
  panelDescription,
}: DeleteConfirmProps) {
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = () => {
    setIsDeleting(true);
    setTimeout(onConfirm, 500);
  };

  if (variant === "panel") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
        <div>
          <p className="text-sm font-bold text-text-darker">{panelTitle ?? `Delete this ${itemLabel}`}</p>
          {panelDescription && <p className="mt-0.5 text-xs text-gray">{panelDescription}</p>}
        </div>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex min-w-28 cursor-pointer items-center justify-center gap-2 rounded-lg bg-danger px-3 py-2 text-xs font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isDeleting ? <Spinner className="h-3.5 w-3.5" /> : "Confirm Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isDeleting}
              className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-dark transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {`Delete ${itemLabel}`}
          </button>
        )}
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-semibold text-danger">Delete?</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="flex min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-danger px-2.5 py-1 text-xs font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isDeleting ? <Spinner className="h-3 w-3" /> : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
          className="cursor-pointer rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-text-dark transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray transition hover:bg-danger/10 hover:text-danger"
      aria-label={`Delete ${itemLabel}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
