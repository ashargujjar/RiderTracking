import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardList, Search } from "lucide-react";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { TableHead, TableShell } from "../components/TableShell";
import { PAGE_SIZE_TABLE } from "../data/constants";
import { useSimulatedLoading } from "../hooks/useSimulatedLoading";
import { getClientUnpaidComplaints, MOCK_COMPLAINTS } from "../data/mockComplaints";
import { complaintStatusTone, paymentStatusTone } from "../data/statusStyles";
import { MOCK_RIDERS } from "../data/mockRiders";

type SortMode = "none" | "unpaid-first" | "paid-first" | "date-newest" | "date-oldest" | "location-asc";

const COLUMNS = [
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
  const isCompleted = status === "completed";
  const isLoading = useSimulatedLoading();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [riderFilter, setRiderFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortMode>("none");

  const baseComplaints = useMemo(
    () =>
      MOCK_COMPLAINTS.filter((complaint) =>
        isCompleted ? complaint.status === "Resolved" : complaint.status !== "Resolved",
      ),
    [isCompleted],
  );

  const complaints = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    let list = baseComplaints.filter((complaint) => {
      if (riderFilter !== "all" && complaint.assignedTo !== riderFilter) return false;
      if (!trimmedQuery) return true;
      return (
        complaint.id === trimmedQuery ||
        complaint.title.toLowerCase().includes(trimmedQuery) ||
        complaint.site.toLowerCase().includes(trimmedQuery)
      );
    });

    if (sortBy === "unpaid-first" || sortBy === "paid-first") {
      const rank = (complaint: (typeof list)[number]) => {
        if (complaint.amountDue === 0) return 2;
        const isUnpaid = complaint.paymentStatus === "Unpaid";
        if (sortBy === "unpaid-first") return isUnpaid ? 0 : 1;
        return isUnpaid ? 1 : 0;
      };
      list = [...list].sort((a, b) => rank(a) - rank(b));
    } else if (sortBy === "date-newest") {
      list = [...list].sort((a, b) => b.raisedDate.localeCompare(a.raisedDate));
    } else if (sortBy === "date-oldest") {
      list = [...list].sort((a, b) => a.raisedDate.localeCompare(b.raisedDate));
    } else if (sortBy === "location-asc") {
      list = [...list].sort((a, b) => a.site.localeCompare(b.site));
    }

    return list;
  }, [baseComplaints, query, riderFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE_TABLE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = complaints.slice((currentPage - 1) * PAGE_SIZE_TABLE, currentPage * PAGE_SIZE_TABLE);

  const title = isCompleted ? "Completed / Closed Complaints" : "Pending Complaints";
  const unpaidCount = baseComplaints.filter(
    (complaint) => complaint.amountDue > 0 && complaint.paymentStatus === "Unpaid",
  ).length;

  const resetToFirstPage = () => setPage(1);

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
            {complaints.length} complaint{complaints.length === 1 ? "" : "s"}
          </p>
          {!isCompleted && unpaidCount > 0 && (
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
              onChange={(event) => {
                setQuery(event.target.value);
                resetToFirstPage();
              }}
              placeholder="Search by ID, title, or site..."
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-darker outline-none placeholder:text-gray focus:border-primary"
            />
          </div>

          <select
            value={riderFilter}
            onChange={(event) => {
              setRiderFilter(event.target.value);
              resetToFirstPage();
            }}
            aria-label="Filter by rider"
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
          >
            <option value="all">All riders</option>
            <option value="Unassigned">Unassigned</option>
            {MOCK_RIDERS.map((rider) => (
              <option key={rider.id} value={rider.name}>
                {rider.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as SortMode);
              resetToFirstPage();
            }}
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
              {pageItems.map((complaint) => {
                const hasOtherUnpaid = getClientUnpaidComplaints(complaint.clientId, complaint.id).length > 0;
                return (
                  <tr
                    key={complaint.id}
                    onClick={() => navigate(`/dashboard/complaints/${complaint.id}/view`)}
                    className="cursor-pointer border-t border-border transition hover:bg-background"
                  >
                    <td className="px-4 py-3 font-semibold text-text-darker">{complaint.title}</td>
                    <td className="px-4 py-3 text-text-dark">{complaint.site}</td>
                    <td className="px-4 py-3 text-text-dark">{complaint.assignedTo}</td>
                    <td className="px-4 py-3 text-text-dark">{complaint.raisedDate}</td>
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
                          {hasOtherUnpaid && (
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
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length}>
                    <EmptyState icon={ClipboardList} title="No complaints found." variant="inline" />
                  </td>
                </tr>
              )}
            </tbody>
          </TableShell>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </PageContainer>
    </>
  );
}
