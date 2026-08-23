import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Bike, ShieldCheck, Wallet } from "lucide-react";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { PAGE_SIZE_CARDS } from "../data/constants";
import { useSimulatedLoading } from "../hooks/useSimulatedLoading";
import { getCarriedOverDue, getClientUnpaidComplaints, MOCK_COMPLAINTS } from "../data/mockComplaints";
import { paymentStatusTone } from "../data/statusStyles";
import { getClientSummary, MOCK_CLIENTS } from "../data/mockClients";

export default function PaymentListPage() {
  const navigate = useNavigate();
  const { status } = useParams<{ status: string }>();
  const isPaid = status === "paid";
  const isLoading = useSimulatedLoading();
  const [page, setPage] = useState(1);

  const complaints = useMemo(
    () =>
      MOCK_COMPLAINTS.filter(
        (complaint) => complaint.amountDue > 0 && complaint.paymentStatus === (isPaid ? "Paid" : "Unpaid"),
      ),
    [isPaid],
  );

  const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE_CARDS));
  const currentPage = Math.min(page, totalPages);
  const pageItems = complaints.slice((currentPage - 1) * PAGE_SIZE_CARDS, currentPage * PAGE_SIZE_CARDS);

  const title = isPaid ? "Paid Complaints" : "Unpaid Complaints";
  const totalOutstanding = complaints.reduce((sum, complaint) => sum + complaint.amountDue, 0);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-text-darker">
            {complaints.length} complaint{complaints.length === 1 ? "" : "s"}
          </p>
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${isPaid ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
          >
            PKR {totalOutstanding.toLocaleString()} {isPaid ? "collected" : "outstanding"}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {pageItems.map((complaint) => {
            const client = MOCK_CLIENTS.find((item) => item.id === complaint.clientId);
            const clientSummary = client ? getClientSummary(client) : undefined;
            const carriedOverDue = !isPaid ? getCarriedOverDue(complaint.clientId, complaint.id) : 0;
            const hasOtherUnpaid = !isPaid && getClientUnpaidComplaints(complaint.clientId, complaint.id).length > 0;
            const totalPayable = complaint.amountDue + carriedOverDue;

            return (
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
                    <p className="mt-1 text-sm text-text-dark">{clientSummary?.site ?? complaint.site}</p>
                  </div>
                  <StatusBadge
                    label={complaint.paymentStatus}
                    tone={paymentStatusTone(complaint.paymentStatus)}
                    className="shrink-0"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray">
                    <Bike className="h-3.5 w-3.5" />
                    {complaint.assignedTo}
                  </div>

                  <div className="text-right">
                    {carriedOverDue > 0 ? (
                      <>
                        <p className="text-xs text-gray">
                          PKR {complaint.amountDue.toLocaleString()} + PKR {carriedOverDue.toLocaleString()} carried
                          over
                        </p>
                        <p className="text-base font-bold text-warning">
                          Total due: PKR {totalPayable.toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className={`text-base font-bold ${isPaid ? "text-success" : "text-warning"}`}>
                        PKR {complaint.amountDue.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {hasOtherUnpaid && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    This client has other unpaid complaints — dues carried onto this one.
                  </div>
                )}
                {isPaid && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                    Payment confirmed via payments API
                  </div>
                )}
              </button>
            );
          })}

          {pageItems.length === 0 && <EmptyState icon={Wallet} title="No complaints found." />}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </PageContainer>
    </>
  );
}
