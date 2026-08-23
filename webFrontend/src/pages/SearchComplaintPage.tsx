import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ClipboardList, Search } from "lucide-react";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { MOCK_COMPLAINTS } from "../data/mockComplaints";
import { complaintStatusTone } from "../data/statusStyles";

export default function SearchComplaintPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const result = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return undefined;
    return MOCK_COMPLAINTS.find((complaint) => complaint.id === trimmed);
  }, [query]);

  return (
    <>
      <PageHeader
        title="Search Complaint"
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Complaints", to: "/dashboard/complaints" }]}
      />

      <PageContainer width="search-single">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter complaint ID..."
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-text-darker outline-none placeholder:text-gray focus:border-primary"
          />
        </div>

        <div className="mt-6">
          {isSearching && (
            <div className="flex items-center gap-2 text-sm font-semibold text-gray">
              <Spinner className="h-4 w-4 border-2 border-border border-t-primary" />
              Searching...
            </div>
          )}

          {!isSearching && query.trim() && !result && (
            <EmptyState icon={ClipboardList} title={`No complaint found with ID "${query.trim()}".`} />
          )}

          {!isSearching && result && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/complaints/${result.id}/view`)}
              className="w-full cursor-pointer rounded-xl border border-border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray">
                    Complaint #{result.id}
                  </p>
                  <p className="mt-1 text-lg font-bold text-text-darker">{result.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={result.status} tone={complaintStatusTone(result.status)} />
                  <ChevronRight className="h-4 w-4 text-gray" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-text-dark">Site</p>
                  <p className="mt-0.5 text-text-darker">{result.site}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-dark">Raised Date</p>
                  <p className="mt-0.5 text-text-darker">{result.raisedDate}</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </PageContainer>
    </>
  );
}
