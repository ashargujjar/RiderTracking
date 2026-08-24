// "Pending Approval" is set by the rider (via the mobile app) when they mark the job
// done — it's not final until an admin reviews the resolution photos/notes and approves,
// which moves it to "Resolved". See backend/schemas/complaint.schema.ts.
export type ComplaintStatus = "Pending" | "In Progress" | "Pending Approval" | "Resolved";

export type PaymentStatus = "Paid" | "Unpaid";

export type ComplaintRecord = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  photoCount: number;
  site: string;
  status: ComplaintStatus;
  assignedTo: string;
  raisedDate: string;
  resolvedDate?: string;
  resolutionNotes?: string;
  resolutionPhotos?: string[]; // rider-submitted proof-of-work photo URLs, optional
  amountDue: number;
  paymentStatus: PaymentStatus;
};

export const MOCK_COMPLAINTS: ComplaintRecord[] = [
  {
    id: "1",
    clientId: "1",
    title: "Inverter not powering on",
    description: "Inverter display stays blank even after the main breaker is switched on. No error codes shown.",
    photoCount: 2,
    site: "Al Noor Residence",
    status: "Pending",
    assignedTo: "Unassigned",
    raisedDate: "2026-08-02",
    amountDue: 0,
    paymentStatus: "Unpaid",
  },
  {
    id: "2",
    clientId: "2",
    title: "Panel output lower than expected",
    description: "Daily generation has dropped by roughly 30% over the past week despite clear weather.",
    photoCount: 1,
    site: "Green Valley Farmhouse",
    status: "In Progress",
    assignedTo: "Bilal Ahmed",
    raisedDate: "2026-08-04",
    amountDue: 0,
    paymentStatus: "Unpaid",
  },
  {
    id: "3",
    clientId: "5",
    title: "Battery not charging fully",
    description: "Battery bank stops charging at around 60% and does not reach full charge overnight.",
    photoCount: 0,
    site: "Riverside Apartments",
    status: "Pending",
    assignedTo: "Unassigned",
    raisedDate: "2026-08-05",
    amountDue: 0,
    paymentStatus: "Unpaid",
  },
  {
    id: "4",
    clientId: "3",
    title: "Wiring issue after installation",
    description: "Loose wiring found near the DC combiner box, exposed cable visible from outside.",
    photoCount: 3,
    site: "Al Falah Textile Mills",
    status: "Resolved",
    assignedTo: "Saif Malik",
    raisedDate: "2026-07-18",
    resolvedDate: "2026-07-20",
    resolutionNotes: "Re-terminated and secured the DC combiner box wiring, added cable clamps.",
    amountDue: 3500,
    paymentStatus: "Paid",
  },
  {
    id: "5",
    clientId: "4",
    title: "Dongle not connecting to app",
    description: "Monitoring dongle shows offline in the app for the past 3 days, no live data.",
    photoCount: 1,
    site: "Sunrise Public School",
    status: "Pending",
    assignedTo: "Unassigned",
    raisedDate: "2026-08-09",
    amountDue: 0,
    paymentStatus: "Unpaid",
  },
  {
    id: "6",
    clientId: "6",
    title: "Structure bolt came loose",
    description: "One of the mounting bolts on the elevated structure appears loose after recent windstorm.",
    photoCount: 2,
    site: "Blue Ridge Warehouse",
    status: "Pending Approval",
    assignedTo: "Hamza Khan",
    raisedDate: "2026-08-10",
    resolutionNotes: "Re-tightened and thread-locked the loose mounting bolt, checked the rest of the array.",
    resolutionPhotos: ["photo-1", "photo-2"],
    amountDue: 0,
    paymentStatus: "Unpaid",
  },
  {
    id: "7",
    clientId: "1",
    title: "Meter reading mismatch",
    description: "Net meter reading does not match the utility bill for the last billing cycle.",
    photoCount: 1,
    site: "Al Noor Residence",
    status: "Resolved",
    assignedTo: "Saif Malik",
    raisedDate: "2026-07-22",
    resolvedDate: "2026-07-25",
    resolutionNotes: "Recalibrated net meter and confirmed matching readings with utility company.",
    amountDue: 1500,
    paymentStatus: "Unpaid",
  },
  {
    id: "8",
    clientId: "2",
    title: "Panel cleaning request",
    description: "Routine cleaning requested after dust buildup noticed on panel surface.",
    photoCount: 0,
    site: "Green Valley Farmhouse",
    status: "Resolved",
    assignedTo: "Bilal Ahmed",
    raisedDate: "2026-07-29",
    resolvedDate: "2026-07-30",
    resolutionNotes: "Panels cleaned on site, generation output back to normal.",
    amountDue: 800,
    paymentStatus: "Paid",
  },
  {
    id: "9",
    clientId: "6",
    title: "Exposed cable near roof edge",
    description: "Client flagged a loose DC cable running along the roof edge that needs to be re-secured.",
    photoCount: 1,
    site: "Blue Ridge Warehouse",
    status: "Pending",
    assignedTo: "Bilal Ahmed",
    raisedDate: "2026-08-12",
    amountDue: 0,
    paymentStatus: "Unpaid",
  },
];

export function getClientUnpaidComplaints(clientId: string, excludeComplaintId?: string): ComplaintRecord[] {
  return MOCK_COMPLAINTS.filter(
    (complaint) =>
      complaint.clientId === clientId &&
      complaint.id !== excludeComplaintId &&
      complaint.amountDue > 0 &&
      complaint.paymentStatus === "Unpaid",
  );
}

/** Sum of unpaid dues still owed by a client from their other complaints — carried forward onto the latest one. */
export function getCarriedOverDue(clientId: string, excludeComplaintId?: string): number {
  return getClientUnpaidComplaints(clientId, excludeComplaintId).reduce(
    (sum, complaint) => sum + complaint.amountDue,
    0,
  );
}

export type ClientComplaintStats = {
  totalCount: number;
  pendingCount: number;
  resolvedCount: number;
};

/** Complaint counts for a client, used on the client profile view. */
export function getClientComplaintStats(clientId: string): ClientComplaintStats {
  const clientComplaints = MOCK_COMPLAINTS.filter((complaint) => complaint.clientId === clientId);
  return {
    totalCount: clientComplaints.length,
    pendingCount: clientComplaints.filter((complaint) => complaint.status !== "Resolved").length,
    resolvedCount: clientComplaints.filter((complaint) => complaint.status === "Resolved").length,
  };
}

/** All complaints raised by a client, most recent first. */
export function getClientComplaints(clientId: string): ComplaintRecord[] {
  return MOCK_COMPLAINTS.filter((complaint) => complaint.clientId === clientId).sort((a, b) =>
    b.raisedDate.localeCompare(a.raisedDate),
  );
}

export type RiderOrderStats = {
  assignedCount: number;
  totalCompletedCount: number;
  monthlyCompletedCount: number;
};

/** Assigned/completed order counts for a rider, matched by name against complaint.assignedTo. */
export function getRiderOrderStats(riderName: string): RiderOrderStats {
  const riderComplaints = MOCK_COMPLAINTS.filter((complaint) => complaint.assignedTo === riderName);
  const now = new Date();

  const totalCompletedCount = riderComplaints.filter((complaint) => complaint.status === "Resolved").length;
  const monthlyCompletedCount = riderComplaints.filter((complaint) => {
    if (complaint.status !== "Resolved" || !complaint.resolvedDate) return false;
    const resolvedDate = new Date(complaint.resolvedDate);
    return resolvedDate.getFullYear() === now.getFullYear() && resolvedDate.getMonth() === now.getMonth();
  }).length;

  return {
    assignedCount: riderComplaints.length,
    totalCompletedCount,
    monthlyCompletedCount,
  };
}
