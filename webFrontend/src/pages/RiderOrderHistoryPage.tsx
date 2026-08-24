import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bike, ChevronLeft, ClipboardList } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { TableHead, TableShell } from "../components/TableShell";
import { getRiderById } from "../api/ridersApi";
import { getComplaints, type ComplaintListItem } from "../api/complaintsApi";
import { complaintStatusTone, paymentStatusTone } from "../data/statusStyles";
import type { RiderRecord } from "../data/mockRiders";

type SortMode = "date-newest" | "date-oldest" | "status";
type FilterMode = "assigned" | "completed";

const COLUMNS = [
  { label: "Title" },
  { label: "Site" },
  { label: "Raised Date" },
  { label: "Status" },
  { label: "Payment" },
];

export default function RiderOrderHistoryPage() {
  const navigate = useNavigate();
  const { id, filter } = useParams<{ id: string; filter: string }>();
  const [rider, setRider] = useState<RiderRecord | null>(null);
  const [isLoadingRider, setIsLoadingRider] = useState(true);
  const filterMode: FilterMode = filter === "completed" ? "completed" : "assigned";
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortMode>("date-newest");

  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!id) return;
    getRiderById(id)
      .then(setRider)
      .catch(() => setRider(null))
      .finally(() => setIsLoadingRider(false));
  }, [id]);

  useEffect(() => {
    setPage(1);
  }, [filterMode]);

  useEffect(() => {
    if (!id) return;
    setIsLoadingOrders(true);
    // "assigned" = every order ever assigned to this rider, any status (no
    // bucket filter); "completed" = just the resolved subset.
    getComplaints(page, { riderId: id, bucket: filterMode === "completed" ? "completed" : undefined })
      .then((data) => {
        setComplaints(data.complaints);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load rider orders"))
      .finally(() => setIsLoadingOrders(false));
  }, [id, page, filterMode]);

  const sortedComplaints = useMemo(() => {
    const list = [...complaints];
    if (sortBy === "date-newest") list.sort((a, b) => b.raisedDate.localeCompare(a.raisedDate));
    else if (sortBy === "date-oldest") list.sort((a, b) => a.raisedDate.localeCompare(b.raisedDate));
    else if (sortBy === "status") list.sort((a, b) => a.status.localeCompare(b.status));
    return list;
  }, [complaints, sortBy]);

  if (isLoadingRider) {
    return (
      <>
        <PageHeader title="Rider Orders" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]} />
        <PageContainer width="wide-table">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (!rider) {
    return (
      <>
        <PageHeader title="Rider Orders" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]} />
        <PageContainer width="wide-table">
          <EmptyState
            icon={Bike}
            title={`No rider found with id "${id}".`}
            actionLabel="Back to Riders"
            onAction={() => navigate("/dashboard/riders")}
          />
        </PageContainer>
      </>
    );
  }

  const pageTitle = filterMode === "completed" ? "Completed Orders History" : "Assigned Orders";

  return (
    <>
      <PageHeader
        title={`${rider.name} — ${pageTitle}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Riders", to: "/dashboard/riders" },
          { label: rider.name, to: `/dashboard/riders/${rider.id}` },
        ]}
      />

      <PageContainer width="wide-table">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/riders/${rider.id}`)}
          className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to rider profile
        </button>

        {isLoadingOrders ? (
          <div className="mt-4">
            <LoadingState />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-bold text-text-darker">
                {totalCount} order{totalCount === 1 ? "" : "s"}
              </p>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortMode)}
                aria-label="Sort orders"
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
              >
                <option value="date-newest">Sort: date (newest)</option>
                <option value="date-oldest">Sort: date (oldest)</option>
                <option value="status">Sort: status</option>
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
                      <td className="px-4 py-3 font-semibold text-text-darker">{complaint.title}</td>
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
                        <EmptyState
                          icon={ClipboardList}
                          title={
                            filterMode === "completed"
                              ? "No completed orders yet."
                              : "No orders assigned to this rider yet."
                          }
                          variant="inline"
                        />
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
