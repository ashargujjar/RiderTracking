import { useEffect, useState } from "react";

import type { LatLng } from "../data/mockTracking";

/**
 * Simulates a rider's GPS ping drifting slightly every few seconds, standing in for a real
 * live-location feed until the rider mobile app is wired up to push actual positions.
 */
export function useLiveRiderPosition(base: LatLng) {
  const [position, setPosition] = useState<LatLng>(base);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [baseLat, baseLng] = base;

  useEffect(() => {
    setPosition([baseLat, baseLng]);
    setUpdatedAt(new Date());

    const interval = setInterval(() => {
      setPosition(([lat, lng]) => [lat + (Math.random() - 0.5) * 0.0015, lng + (Math.random() - 0.5) * 0.0015]);
      setUpdatedAt(new Date());
    }, 4000);

    return () => clearInterval(interval);
  }, [baseLat, baseLng]);

  return { position, updatedAt };
}
