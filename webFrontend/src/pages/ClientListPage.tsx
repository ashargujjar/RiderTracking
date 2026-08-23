import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, X } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { DeleteConfirm } from "../components/DeleteConfirm";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { TableHead, TableShell } from "../components/TableShell";
import { WhatsappStatusBadge } from "../components/WhatsappStatusBadge";
import { deleteClient, getClients, type ApiClientDoc } from "../api/clientsApi";
import { getApiClientSummary } from "../lib/clientMapping";

const COLUMNS = [
  { label: "Client ID" },
  { label: "File No" },
  { label: "Site" },
  { label: "Location" },
  { label: "Username" },
  { label: "Contact No" },
  { label: "WhatsApp" },
  { label: "Actions", className: "text-right" },
];

type SortMode = "none" | "site-asc" | "location-asc" | "fileNo-asc" | "status" | "whatsapp-pending-first";

export default function ClientListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortMode>("none");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ApiClientDoc[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadClients = () => {
    setIsLoading(true);
    getClients(page, search)
      .then((data) => {
        setClients(data.clients);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const sortedClients = useMemo(() => {
    if (sortBy === "none") return clients;
    const list = [...clients];
    if (sortBy === "site-asc")
      list.sort((a, b) => getApiClientSummary(a).site.localeCompare(getApiClientSummary(b).site));
    else if (sortBy === "location-asc")
      list.sort((a, b) => getApiClientSummary(a).location.localeCompare(getApiClientSummary(b).location));
    else if (sortBy === "fileNo-asc")
      list.sort((a, b) => getApiClientSummary(a).fileNo.localeCompare(getApiClientSummary(b).fileNo));
    else if (sortBy === "status")
      list.sort((a, b) => getApiClientSummary(a).status.localeCompare(getApiClientSummary(b).status));
    else if (sortBy === "whatsapp-pending-first")
      list.sort((a, b) => Number(a.whatsappSent ?? false) - Number(b.whatsappSent ?? false));
    return list;
  }, [clients, sortBy]);

  const handleDelete = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      toast.success("Client deleted");
      loadClients();
    } catch {
      toast.error("Failed to delete client");
    }
  };

  return (
    <>
      <PageHeader
        title="All Clients"
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]}
      />

      <PageContainer width="wide-table">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by client ID, file no, site, location, username, or contact number..."
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
                {totalCount} client{totalCount === 1 ? "" : "s"}
                {search && ` matching "${search}"`}
              </p>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortMode)}
                aria-label="Sort clients"
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-darker outline-none focus:border-primary"
              >
                <option value="none">Sort: default</option>
                <option value="site-asc">Sort: site (A–Z)</option>
                <option value="location-asc">Sort: location (A–Z)</option>
                <option value="fileNo-asc">Sort: file no (A–Z)</option>
                <option value="status">Sort: status</option>
                <option value="whatsapp-pending-first">Sort: WhatsApp pending first</option>
              </select>
            </div>

            <div className="mt-5">
              <TableShell>
                <TableHead columns={COLUMNS} />
                <tbody>
                  {sortedClients.map((client) => {
                    const summary = getApiClientSummary(client);
                    return (
                      <tr key={client._id} className="border-t border-border transition hover:bg-background">
                        <td
                          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                          className="cursor-pointer px-4 py-3 text-text-dark"
                        >
                          {client._id}
                        </td>
                        <td
                          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                          className="cursor-pointer px-4 py-3 text-text-dark"
                        >
                          {summary.fileNo}
                        </td>
                        <td
                          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                          className="cursor-pointer px-4 py-3 font-semibold text-text-darker"
                        >
                          {summary.site}
                        </td>
                        <td
                          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                          className="cursor-pointer px-4 py-3 text-text-dark"
                        >
                          {summary.location}
                        </td>
                        <td
                          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                          className="cursor-pointer px-4 py-3 text-text-dark"
                        >
                          {summary.username}
                        </td>
                        <td
                          onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                          className="cursor-pointer px-4 py-3 text-text-dark"
                        >
                          {summary.contactNo}
                        </td>
                        <td className="px-4 py-3">
                          <WhatsappStatusBadge sent={client.whatsappSent ?? false} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DeleteConfirm itemLabel={summary.site} onConfirm={() => handleDelete(client._id)} />
                        </td>
                      </tr>
                    );
                  })}
                  {sortedClients.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length}>
                        <EmptyState
                          icon={Users}
                          title={search ? `No clients match "${search}".` : "No clients found."}
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
