import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { LinkCard } from "../components/LinkCard";
import { LoadingState } from "../components/LoadingState";
import { getComplaints } from "../api/complaintsApi";

export default function PaymentManagementPage() {
  const navigate = useNavigate();
  const [unpaidCount, setUnpaidCount] = useState<number | undefined>(undefined);
  const [paidCount, setPaidCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      getComplaints(1, { paymentStatus: "Unpaid" }),
      getComplaints(1, { paymentStatus: "Paid" }),
    ])
      .then(([unpaid, paid]) => {
        setUnpaidCount(unpaid.totalCount);
        setPaidCount(paid.totalCount);
      })
      .catch(() => toast.error("Failed to load payment summary"));
  }, []);

  const isLoading = unpaidCount === undefined || paidCount === undefined;

  const LINK_CARDS = [
    {
      key: "unpaid-complaints",
      title: "Unpaid Complaints",
      description: "Complaints with a payment due that has not been settled yet.",
      icon: AlertTriangle,
      tone: "warning" as const,
      path: "/dashboard/payments/unpaid",
      count: unpaidCount ?? 0,
    },
    {
      key: "paid-complaints",
      title: "Paid Complaints",
      description: "Complaints where the amount due has been fully paid.",
      icon: CheckCircle2,
      tone: "success" as const,
      path: "/dashboard/payments/paid",
      count: paidCount ?? 0,
    },
  ];

  return (
    <>
      <PageHeader title="Payment Management" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]} />

      <PageContainer width="hub">
        <p className="text-sm text-gray">Track amounts due and settle payments for complaints.</p>

        {isLoading ? (
          <div className="mt-8">
            <LoadingState />
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {LINK_CARDS.map(({ key, title, description, icon, tone, path, count }) => (
              <LinkCard
                key={key}
                title={title}
                description={description}
                icon={icon}
                tone={tone}
                count={count}
                onClick={() => navigate(path)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
