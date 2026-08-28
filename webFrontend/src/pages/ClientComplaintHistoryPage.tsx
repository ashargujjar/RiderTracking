import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ClipboardList, Search, Users } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { TableHead, TableShell } from "../components/TableShell";
import { getClientById, type ApiClientDoc } from "../api/clientsApi";
import { getComplaints, type ComplaintListItem } from "../api/complaintsApi";
import { getApiClientSummary } from "../lib/clientMapping";
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
  const [isLoadingClient, setIsLoadingClient] = useState(true);

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("date-newest");

  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  useEffect(() => {
    if (!id) return;
    getClientById(id)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setIsLoadingClient(false));
  }, [id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!id) return;
    setIsLoadingComplaints(true);
    getComplaints(page, { clientId: id, search: search || undefined })
      .then((data) => {
        setComplaints(data.complaints);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load complaint history"))
      .finally(() => setIsLoadingComplaints(false));
  }, [id, page, search]);

  const summary = client ? getApiClientSummary(client) : undefined;

  // Sorts only the currently-loaded page, same convention as
  // ComplaintListPage.tsx — a full cross-page sort would need to move server-side.
  const sortedComplaints = useMemo(() => {
    const list = [...complaints];
    if (sortBy === "date-newest") list.sort((a, b) => b.raisedDate.localeCompare(a.raisedDate));
    else if (sortBy === "date-oldest") list.sort((a, b) => a.raisedDate.localeCompare(b.raisedDate));
    else if (sortBy === "status") list.sort((a, b) => a.status.localeCompare(b.status));
    else if (sortBy === "payment") list.sort((a, b) => a.paymentStatus.localeCompare(b.paymentStatus));
    return list;
  }, [complaints, sortBy]);

  if (isLoadingClient) {
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

        {isLoadingComplaints ? (
          <div className="mt-5">
            <LoadingState />
          </div>
        ) : (
          <>
            <p className="mt-4 text-lg font-bold text-text-darker">
              {totalCount} complaint{totalCount === 1 ? "" : "s"}
              {search && ` matching "${search}"`}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-50 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by complaint ID or title..."
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
                  {sortedComplaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      onClick={() => navigate(`/dashboard/complaints/${complaint.id}/view`)}
                      className="cursor-pointer border-t border-border transition hover:bg-background"
                    >
                      <td className="px-4 py-3 font-semibold text-text-darker">#{complaint.id}</td>
                      <td className="px-4 py-3 text-text-dark">{complaint.title}</td>
                      <td className="px-4 py-3 text-text-dark">{complaint.site}</td>
                      <td className="px-4 py-3 text-text-dark">{complaint.raisedDate.slice(0, 10)}</td>
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
                  {sortedComplaints.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length}>
                        <EmptyState icon={ClipboardList} title="No complaints found." variant="inline" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </TableShell>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </PageContainer>
    </>
  );
}
