import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { LinkCard } from "../components/LinkCard";
import { MOCK_COMPLAINTS } from "../data/mockComplaints";

export default function PaymentManagementPage() {
  const navigate = useNavigate();

  const billableComplaints = MOCK_COMPLAINTS.filter((complaint) => complaint.amountDue > 0);
  const unpaidCount = billableComplaints.filter((complaint) => complaint.paymentStatus === "Unpaid").length;
  const paidCount = billableComplaints.filter((complaint) => complaint.paymentStatus === "Paid").length;

  const LINK_CARDS = [
    {
      key: "unpaid-complaints",
      title: "Unpaid Complaints",
      description: "Complaints with a payment due that has not been settled yet.",
      icon: AlertTriangle,
      tone: "warning" as const,
      path: "/dashboard/payments/unpaid",
      count: unpaidCount,
    },
    {
      key: "paid-complaints",
      title: "Paid Complaints",
      description: "Complaints where the amount due has been fully paid.",
      icon: CheckCircle2,
      tone: "success" as const,
      path: "/dashboard/payments/paid",
      count: paidCount,
    },
  ];

  return (
    <>
      <PageHeader title="Payment Management" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]} />

      <PageContainer width="hub">
        <p className="text-sm text-gray">Track amounts due and settle payments for complaints.</p>

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
      </PageContainer>
    </>
  );
}
