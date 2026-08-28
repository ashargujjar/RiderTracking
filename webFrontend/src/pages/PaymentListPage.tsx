import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { getComplaints, type ComplaintListItem } from "../api/complaintsApi";
import { paymentStatusTone } from "../data/statusStyles";

export default function PaymentListPage() {
  const navigate = useNavigate();
  const { status } = useParams<{ status: string }>();
  const isPaid = status === "paid";

  const [page, setPage] = useState(1);
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [isPaid]);

  useEffect(() => {
    setIsLoading(true);
    getComplaints(page, { paymentStatus: isPaid ? "Paid" : "Unpaid" })
      .then((data) => {
        setComplaints(data.complaints);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      })
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setIsLoading(false));
  }, [page, isPaid]);

  const title = isPaid ? "Paid Complaints" : "Unpaid Complaints";

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Payments", to: "/dashboard/payments" }]}
      />

      <PageContainer width="compact">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <p className="text-lg font-bold text-text-darker">
              {totalCount} complaint{totalCount === 1 ? "" : "s"}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {complaints.map((complaint) => (
                <button
                  key={complaint.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/complaints/${complaint.id}/view`)}
                  className="cursor-pointer rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray">
                        Complaint #{complaint.id}
                      </p>
                      <p className="mt-0.5 font-bold text-text-darker">{complaint.title}</p>
                      <p className="mt-1 text-sm text-text-dark">{complaint.site}</p>
                    </div>
                    <StatusBadge
                      label={complaint.paymentStatus}
                      tone={paymentStatusTone(complaint.paymentStatus)}
                      className="shrink-0"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <div className="text-xs text-gray">{complaint.assignedTo ?? "Not yet assigned"}</div>

                    <p className={`text-base font-bold ${isPaid ? "text-success" : "text-warning"}`}>
                      PKR {complaint.amountDue.toLocaleString()}
                    </p>
                  </div>

                  {complaint.hasOtherUnpaid && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      This client has other unpaid complaints — dues carried onto this one.
                    </div>
                  )}
                  {isPaid && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                      Payment confirmed
                    </div>
                  )}
                </button>
              ))}

              {complaints.length === 0 && <EmptyState icon={Wallet} title="No complaints found." />}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </PageContainer>
    </>
  );
}
