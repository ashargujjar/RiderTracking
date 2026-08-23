import type { ComplaintStatus, PaymentStatus } from "./mockComplaints";

export type StatusTone = "pending" | "in-progress" | "resolved" | "paid" | "unpaid" | "neutral";

export const STATUS_TONE_STYLES: Record<StatusTone, string> = {
  pending: "bg-warning/15 text-warning",
  "in-progress": "bg-primary/15 text-primary",
  resolved: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  unpaid: "bg-warning/15 text-warning",
  neutral: "bg-gray/15 text-gray",
};

export function complaintStatusTone(status: ComplaintStatus): StatusTone {
  if (status === "Pending") return "pending";
  if (status === "In Progress") return "in-progress";
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
