import { apiFetch } from "./client";

export type ComplaintStatus =
  | "Pending"
  | "Assigned"
  | "On The Way"
  | "Arrived"
  | "Pending Approval"
  | "Resolved";

export type PaymentStatus = "Paid" | "Unpaid";

export type ComplaintListItem = {
  id: string;
  title: string;
  status: ComplaintStatus;
  raisedDate: string;
  amountDue: number;
  paymentStatus: PaymentStatus;
  clientId: string;
  site: string;
  location: string;
  assignedTo: string | null;
  hasOtherUnpaid: boolean;
};

type ApiComplaintListItem = Omit<ComplaintListItem, "id"> & { _id: number };

function toComplaintListItem(doc: ApiComplaintListItem): ComplaintListItem {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export type ComplaintsBucket = "pending" | "completed";

export type ComplaintsPage = {
  complaints: ComplaintListItem[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export async function getComplaints(
  page: number,
  options: { search?: string; bucket?: ComplaintsBucket; riderId?: string; date?: string } = {},
): Promise<ComplaintsPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (options.search) params.set("search", options.search);
  if (options.bucket) params.set("bucket", options.bucket);
  if (options.riderId) params.set("riderId", options.riderId);
  if (options.date) params.set("date", options.date);

  const data = await apiFetch<{
    success: boolean;
    complaints: ApiComplaintListItem[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }>(`/complaints?${params.toString()}`);

  return {
    complaints: data.complaints.map(toComplaintListItem),
    currentPage: data.currentPage,
    totalPages: data.totalPages,
    totalCount: data.totalCount,
  };
}

export type ComplaintTimelineEvent = {
  status: ComplaintStatus;
  at: string;
};

export type ComplaintDetail = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  photos: string[];
  status: ComplaintStatus;
  timeline: ComplaintTimelineEvent[];
  assignedTo: { id: string; name: string | null } | null;
  raisedDate: string;
  resolutionNotes?: string;
  resolutionPhotos: string[];
  riderResolvedAt?: string;
  resolvedDate?: string;
  totalAmount: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  // Flips true the first time an admin ever sets amountDue (even to 0) —
  // distinguishes "priced at zero" from "never priced yet".
  isPriced: boolean;
  // Sum of amountDue still owed on this client's OTHER unpaid complaints —
  // computed live server-side, not stored on this complaint.
  carriedOverDue: number;
  client: {
    id: string;
    site: string;
    location: string;
    contactNo: string;
    installationStatus: string | null;
  } | null;
};

type ApiComplaintClient = Omit<NonNullable<ComplaintDetail["client"]>, "id"> & { _id: string };
type ApiComplaintRider = { _id: string; name: string | null };

type ApiComplaintDetail = Omit<ComplaintDetail, "id" | "assignedTo" | "client"> & {
  _id: number;
  assignedTo: ApiComplaintRider | null;
  client: ApiComplaintClient | null;
};

function toComplaintClient(client: ApiComplaintClient): NonNullable<ComplaintDetail["client"]> {
  return {
    id: client._id,
    site: client.site,
    location: client.location,
    contactNo: client.contactNo,
    installationStatus: client.installationStatus,
  };
}

function toComplaintDetail(doc: ApiComplaintDetail): ComplaintDetail {
  const { _id, assignedTo, client, ...rest } = doc;

  return {
    id: String(_id),
    ...rest,
    assignedTo: assignedTo ? { id: assignedTo._id, name: assignedTo.name } : null,
    client: client ? toComplaintClient(client) : null,
  };
}

export async function getComplaintById(id: string): Promise<ComplaintDetail> {
  const data = await apiFetch<{ success: boolean; complaint: ApiComplaintDetail }>(`/complaints/${id}`);
  return toComplaintDetail(data.complaint);
}

export type UpdateComplaintPayload = {
  status?: ComplaintStatus;
  assignedTo?: string | null;
  amountDue?: number;
  paymentStatus?: PaymentStatus;
};

export async function updateComplaint(id: string, payload: UpdateComplaintPayload): Promise<ComplaintDetail> {
  const data = await apiFetch<{ success: boolean; complaint: ApiComplaintDetail }>(`/complaints/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return toComplaintDetail(data.complaint);
}
