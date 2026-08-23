import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, MapPin, Search, X } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { TableHead, TableShell } from "../components/TableShell";
import { getRiders } from "../api/ridersApi";
import type { RiderRecord } from "../data/mockRiders";

const COLUMNS = [
  { label: "Name" },
  { label: "Username" },
  { label: "Phone" },
  { label: "Category" },
  { label: "Actions", className: "text-right" },
];

type SortMode = "none" | "name-asc" | "phone-asc" | "category";

export default function RiderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortMode>("none");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setIsLoading(true);
    getRiders(page, search)
      .then((data) => {
        setRiders(data.riders);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load riders"))
      .finally(() => setIsLoading(false));
  }, [page, search]);

  const sortedRiders = useMemo(() => {
    if (sortBy === "none") return riders;
    const list = [...riders];
    if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "phone-asc") list.sort((a, b) => a.phone.localeCompare(b.phone));
    else if (sortBy === "category") list.sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [riders, sortBy]);

  return (
    <>
      <PageHeader
        title="All Riders"
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]}
      />

      <PageContainer width="compact">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by rider ID, name, phone, category, or username..."
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-9 text-sm text-text-darker outline-none placeholder:text-gray focus:border-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-gray transition hover:bg-background hover:text-text-dark"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-4">
            <LoadingState />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-bold text-text-darker">
                {totalCount} rider{totalCount === 1 ? "" : "s"}
                {search && ` matching "${search}"`}
              </p>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortMode)}
                aria-label="Sort riders"
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
              >
                <option value="none">Sort: default</option>
                <option value="name-asc">Sort: name (A–Z)</option>
                <option value="phone-asc">Sort: phone (A–Z)</option>
                <option value="category">Sort: category</option>
              </select>
            </div>

            <div className="mt-5">
              <TableShell>
                <TableHead columns={COLUMNS} />
                <tbody>
                  {sortedRiders.map((rider) => (
                    <tr key={rider.id} className="border-t border-border transition hover:bg-background">
                      <td
                        onClick={() => navigate(`/dashboard/riders/${rider.id}`)}
                        className="cursor-pointer px-4 py-3 font-semibold text-text-darker"
                      >
                        {rider.name}
                      </td>
                      <td
                        onClick={() => navigate(`/dashboard/riders/${rider.id}`)}
                        className="cursor-pointer px-4 py-3 text-text-dark"
                      >
                        {rider.username ?? "—"}
                      </td>
                      <td
                        onClick={() => navigate(`/dashboard/riders/${rider.id}`)}
                        className="cursor-pointer px-4 py-3 text-text-dark"
                      >
                        {rider.phone}
                      </td>
                      <td
                        onClick={() => navigate(`/dashboard/riders/${rider.id}`)}
                        className="cursor-pointer px-4 py-3 text-text-dark"
                      >
                        {rider.category}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/riders/${rider.id}/tracking`)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray transition hover:bg-primary/10 hover:text-primary"
                          aria-label={`Track ${rider.name}`}
                          title="Track live location"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedRiders.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length}>
                        <EmptyState
                          icon={Bike}
                          title={search ? `No riders match "${search}".` : "No riders found."}
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
