import { useEffect, useState } from "react";

/**
 * Simulates the loading state a real API fetch would produce. Swap the timeout for the
 * actual request once the backend exists — the isLoading contract callers rely on stays the same.
 */
export function useSimulatedLoading(delayMs = 500): boolean {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isLoading;
}
