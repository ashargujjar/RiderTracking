import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ClipboardList, Search, Users } from "lucide-react";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { TableHead, TableShell } from "../components/TableShell";
import { getClientById, type ApiClientDoc } from "../api/clientsApi";
import { getApiClientSummary } from "../lib/clientMapping";
import { getClientComplaints } from "../data/mockComplaints";
import { complaintStatusTone, paymentStatusTone } from "../data/statusStyles";

type SortMode = "date-newest" | "date-oldest" | "status" | "payment";

const COLUMNS = [
  { label: "ID" },
  { label: "Title" },
  { label: "Site" },
  { label: "Raised Date" },
  { label: "Status" },
  { label: "Payment" },
];

export default function ClientComplaintHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ApiClientDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("date-newest");

  useEffect(() => {
    if (!id) return;
    getClientById(id)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const summary = client ? getApiClientSummary(client) : undefined;

  const complaints = useMemo(() => {
    if (!client) return [];
    const trimmed = query.trim().toLowerCase();
    let list = getClientComplaints(client._id).filter(
      (complaint) => !trimmed || complaint.id.toLowerCase().includes(trimmed),
    );

    if (sortBy === "date-newest") list = [...list].sort((a, b) => b.raisedDate.localeCompare(a.raisedDate));
    else if (sortBy === "date-oldest") list = [...list].sort((a, b) => a.raisedDate.localeCompare(b.raisedDate));
    else if (sortBy === "status") list = [...list].sort((a, b) => a.status.localeCompare(b.status));
    else if (sortBy === "payment") list = [...list].sort((a, b) => a.paymentStatus.localeCompare(b.paymentStatus));

    return list;
  }, [client, query, sortBy]);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Complaint History" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]} />
        <PageContainer width="wide-table">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (!client || !summary) {
    return (
      <>
        <PageHeader title="Complaint History" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]} />
        <PageContainer width="compact">
          <EmptyState
            icon={Users}
            title={`No client found with id "${id}".`}
            actionLabel="Back to Clients"
            onAction={() => navigate("/dashboard/clients")}
          />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${summary.site} — Complaint History`}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Clients", to: "/dashboard/clients" },
          { label: summary.site, to: `/dashboard/clients/${client._id}` },
        ]}
      />

      <PageContainer width="wide-table">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
          className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to client profile
        </button>

        <p className="mt-4 text-lg font-bold text-text-darker">
          {complaints.length} complaint{complaints.length === 1 ? "" : "s"}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-50 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by complaint ID..."
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-darker outline-none placeholder:text-gray focus:border-primary"
            />
          </div>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortMode)}
            aria-label="Sort complaints"
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
          >
            <option value="date-newest">Sort: date (newest)</option>
            <option value="date-oldest">Sort: date (oldest)</option>
            <option value="status">Sort: status</option>
            <option value="payment">Sort: payment</option>
          </select>
        </div>

        <div className="mt-5">
          <TableShell>
            <TableHead columns={COLUMNS} />
            <tbody>
              {complaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  onClick={() => navigate(`/dashboard/complaints/${complaint.id}/view`)}
                  className="cursor-pointer border-t border-border transition hover:bg-background"
                >
                  <td className="px-4 py-3 font-semibold text-text-darker">#{complaint.id}</td>
                  <td className="px-4 py-3 text-text-dark">{complaint.title}</td>
                  <td className="px-4 py-3 text-text-dark">{complaint.site}</td>
                  <td className="px-4 py-3 text-text-dark">{complaint.raisedDate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={complaint.status} tone={complaintStatusTone(complaint.status)} />
                  </td>
                  <td className="px-4 py-3">
                    {complaint.amountDue > 0 ? (
                      <StatusBadge label={complaint.paymentStatus} tone={paymentStatusTone(complaint.paymentStatus)} />
                    ) : (
                      <span className="text-xs text-gray">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length}>
                    <EmptyState icon={ClipboardList} title="No complaints match your search." variant="inline" />
                  </td>
                </tr>
              )}
            </tbody>
          </TableShell>
        </div>
      </PageContainer>
    </>
  );
}
