import type { PaymentStatus } from "./mockComplaints";

export type StatusTone =
  | "pending"
  | "in-progress"
  | "pending-approval"
  | "resolved"
  | "paid"
  | "unpaid"
  | "neutral";

export const STATUS_TONE_STYLES: Record<StatusTone, string> = {
  pending: "bg-warning/15 text-warning",
  "in-progress": "bg-primary/15 text-primary",
  "pending-approval": "bg-secondary/15 text-secondary",
  resolved: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  unpaid: "bg-warning/15 text-warning",
  neutral: "bg-gray/15 text-gray",
};

// Accepts a plain string rather than a specific ComplaintStatus type since callers
// pull complaint statuses from two overlapping enums as the app migrates off mock
// data — the old 4-value mock set ("In Progress") and the real backend's 6-value
// set (Assigned/On The Way/Arrived, all still "in progress" from a display POV).
export function complaintStatusTone(status: string): StatusTone {
  if (status === "Pending") return "pending";
  if (status === "In Progress" || status === "Assigned" || status === "On The Way" || status === "Arrived") {
    return "in-progress";
  }
  if (status === "Pending Approval") return "pending-approval";
  return "resolved";
}

export function paymentStatusTone(status: PaymentStatus): StatusTone {
  return status === "Paid" ? "paid" : "unpaid";
}

export function clientStatusTone(status: string): StatusTone {
  if (status === "Pending") return "pending";
  if (status === "In Progress") return "in-progress";
  if (status === "Completed") return "resolved";
  return "neutral";
}
