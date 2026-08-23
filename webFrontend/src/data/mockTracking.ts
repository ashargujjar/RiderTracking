import { getClientSummary, MOCK_CLIENTS } from "./mockClients";
import { MOCK_COMPLAINTS, type ComplaintRecord } from "./mockComplaints";
import { MOCK_RIDERS, type RiderRecord } from "./mockRiders";

export type LatLng = [number, number];

const CITY_COORDS: Record<string, LatLng> = {
  Karachi: [24.8607, 67.0011],
  Lahore: [31.5497, 74.3436],
  Faisalabad: [31.4187, 73.0791],
  Multan: [30.1575, 71.5249],
};

// Deterministic pseudo-random offset so the same complaint/rider always lands on the same spot
// on the map across renders, without needing real coordinates in the mock data.
function seededOffset(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.05;
}

function coordsForLocation(location: string, seed: number): LatLng {
  const city = Object.keys(CITY_COORDS).find((name) => location.includes(name)) ?? "Lahore";
  const [lat, lng] = CITY_COORDS[city];
  return [lat + seededOffset(seed), lng + seededOffset(seed + 11)];
}

/** Approximate map position for each complaint, derived from its client's site location. */
export const COMPLAINT_LOCATIONS: Record<string, LatLng> = Object.fromEntries(
  MOCK_COMPLAINTS.map((complaint, index) => {
    const client = MOCK_CLIENTS.find((item) => item.id === complaint.clientId);
    const location = client ? getClientSummary(client).location : "Lahore";
    return [complaint.id, coordsForLocation(location, index * 7 + 3)];
  }),
);

/** Starting map position for each rider's live tracking — anchored near their current active job. */
export const RIDER_BASE_LOCATIONS: Record<string, LatLng> = Object.fromEntries(
  MOCK_RIDERS.map((rider, index) => {
    const active = MOCK_COMPLAINTS.find((complaint) => complaint.assignedTo === rider.name && complaint.status !== "Resolved");
    const anchor = active ? COMPLAINT_LOCATIONS[active.id] : coordsForLocation("Lahore", index * 5 + 1);
    return [rider.id, [anchor[0] + 0.012, anchor[1] - 0.01]];
  }),
);

/**
 * Complaints currently assigned to a rider, ordered as their working queue: the active
 * (In Progress) job first, then Pending jobs oldest-raised first.
 */
export function getRiderQueue(rider: RiderRecord): ComplaintRecord[] {
  return MOCK_COMPLAINTS.filter(
    (complaint) => complaint.assignedTo === rider.name && complaint.status !== "Resolved",
  ).sort((a, b) => {
    if (a.status !== b.status) return a.status === "In Progress" ? -1 : 1;
    return a.raisedDate.localeCompare(b.raisedDate);
  });
}
