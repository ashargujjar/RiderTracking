import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardList, Search, X } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { TableHead, TableShell } from "../components/TableShell";
import { getComplaints, type ComplaintListItem, type ComplaintsBucket } from "../api/complaintsApi";
import { getRiders } from "../api/ridersApi";
import { getSocket } from "../lib/socket";
import { complaintStatusTone, paymentStatusTone } from "../data/statusStyles";
import type { RiderRecord } from "../data/mockRiders";

type SortMode = "none" | "unpaid-first" | "paid-first" | "date-newest" | "date-oldest" | "location-asc";

const COLUMNS = [
  { label: "ID" },
  { label: "Title" },
  { label: "Site" },
  { label: "Assigned Rider" },
  { label: "Raised Date" },
  { label: "Status" },
  { label: "Payment" },
];

export default function ComplaintListPage() {
  const navigate = useNavigate();
  const { status } = useParams<{ status: string }>();
  const bucket: ComplaintsBucket = status === "completed" ? "completed" : "pending";

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [riderFilter, setRiderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("none");

  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Only the first page of riders is fetched for this filter dropdown — fine
  // while rider counts are small, but it'll silently miss riders once there
  // are more than fit on one page.
  const [riders, setRiders] = useState<RiderRecord[]>([]);

  useEffect(() => {
    setPage(1);
  }, [bucket]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    getRiders(1).then((data) => setRiders(data.riders)).catch(() => {
      // Non-fatal — the rider filter just won't have options.
    });
  }, []);

  // New complaints always start in the pending bucket — refetch this page
  // the moment one arrives so it shows up without a manual refresh.
  useEffect(() => {
    if (bucket !== "pending") return;

    const socket = getSocket();
    const handleNewComplaint = () => setRefreshKey((key) => key + 1);
    socket.on("complaint:new", handleNewComplaint);
    return () => {
      socket.off("complaint:new", handleNewComplaint);
    };
  }, [bucket]);

  useEffect(() => {
    setIsLoading(true);
    getComplaints(page, {
      search,
      bucket,
      riderId: riderFilter === "all" ? undefined : riderFilter,
      date: dateFilter || undefined,
    })
      .then((data) => {
        setComplaints(data.complaints);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setIsLoading(false));
  }, [page, search, bucket, riderFilter, dateFilter, refreshKey]);

  const sortedComplaints = useMemo(() => {
    if (sortBy === "none") return complaints;
    const list = [...complaints];

    if (sortBy === "unpaid-first" || sortBy === "paid-first") {
      const rank = (complaint: ComplaintListItem) => {
        if (complaint.amountDue === 0) return 2;
        const isUnpaid = complaint.paymentStatus === "Unpaid";
        if (sortBy === "unpaid-first") return isUnpaid ? 0 : 1;
        return isUnpaid ? 1 : 0;
      };
      list.sort((a, b) => rank(a) - rank(b));
    } else if (sortBy === "date-newest") {
      list.sort((a, b) => b.raisedDate.localeCompare(a.raisedDate));
    } else if (sortBy === "date-oldest") {
      list.sort((a, b) => a.raisedDate.localeCompare(b.raisedDate));
    } else if (sortBy === "location-asc") {
      list.sort((a, b) => a.site.localeCompare(b.site));
    }

    return list;
  }, [complaints, sortBy]);

  const title = bucket === "completed" ? "Completed / Closed Complaints" : "Pending Complaints";
  const unpaidCount = complaints.filter(
    (complaint) => complaint.amountDue > 0 && complaint.paymentStatus === "Unpaid",
  ).length;

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Complaints", to: "/dashboard/complaints" }]}
      />

      <PageContainer width="wide-table">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-text-darker">
            {totalCount} complaint{totalCount === 1 ? "" : "s"}
            {search && ` matching "${search}"`}
            {dateFilter && ` raised on ${dateFilter}`}
          </p>
          {bucket === "pending" && unpaidCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {unpaidCount} unpaid
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-50 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, title, or site..."
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-darker outline-none placeholder:text-gray focus:border-primary"
            />
          </div>

          <select
            value={riderFilter}
            onChange={(event) => {
              setRiderFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by rider"
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
          >
            <option value="all">All riders</option>
            <option value="unassigned">Unassigned</option>
            {riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by raised date"
              className="h-10 rounded-lg border border-border bg-white px-3 pr-8 text-sm text-text-darker outline-none focus:border-primary"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter("");
                  setPage(1);
                }}
                aria-label="Clear date filter"
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-gray hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortMode)}
            aria-label="Sort complaints"
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
          >
            <option value="none">Sort: default</option>
            <option value="date-newest">Sort: date (newest)</option>
            <option value="date-oldest">Sort: date (oldest)</option>
            <option value="location-asc">Sort: location (A–Z)</option>
            <option value="unpaid-first">Sort: unpaid first</option>
            <option value="paid-first">Sort: paid first</option>
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
                  <td className="px-4 py-3 text-text-dark">#{complaint.id}</td>
                  <td className="px-4 py-3 font-semibold text-text-darker">{complaint.title}</td>
                  <td className="px-4 py-3 text-text-dark">{complaint.site}</td>
                  <td className="px-4 py-3 text-text-dark">{complaint.assignedTo ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-text-dark">{complaint.raisedDate.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={complaint.status} tone={complaintStatusTone(complaint.status)} />
                  </td>
                  <td className="px-4 py-3">
                    {complaint.amountDue > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <StatusBadge
                          label={complaint.paymentStatus}
                          tone={paymentStatusTone(complaint.paymentStatus)}
                        />
                        {complaint.hasOtherUnpaid && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 shrink-0 text-warning"
                            aria-label="Client has other unpaid complaints"
                          />
                        )}
                      </div>
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
