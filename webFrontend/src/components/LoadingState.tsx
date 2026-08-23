import { Spinner } from "./Spinner";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-sm font-semibold text-gray">
      <Spinner className="h-6 w-6 border-2 border-border border-t-primary" />
      Loading...
    </div>
  );
}
