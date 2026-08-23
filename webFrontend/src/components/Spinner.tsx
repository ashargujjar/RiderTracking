type SpinnerProps = {
  className?: string;
};

export function Spinner({ className = "h-4 w-4 border-2 border-white/40 border-t-white" }: SpinnerProps) {
  return <span className={`inline-block shrink-0 animate-spin rounded-full ${className}`} aria-label="Loading" />;
}
