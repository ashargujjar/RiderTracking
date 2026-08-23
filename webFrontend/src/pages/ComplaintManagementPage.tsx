import { CheckCircle2, Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { LinkCard } from "../components/LinkCard";
import { MOCK_COMPLAINTS } from "../data/mockComplaints";

export default function ComplaintManagementPage() {
  const navigate = useNavigate();

  const pendingCount = MOCK_COMPLAINTS.filter((complaint) => complaint.status !== "Resolved").length;
  const completedCount = MOCK_COMPLAINTS.filter((complaint) => complaint.status === "Resolved").length;

  const LINK_CARDS = [
    {
      key: "pending-complaints",
      title: "Pending Complaints",
      description: "Complaints still open or in progress, awaiting resolution.",
      icon: Clock,
      tone: "warning" as const,
      path: "/dashboard/complaints/pending",
      count: pendingCount,
    },
    {
      key: "completed-complaints",
      title: "Completed / Closed Complaints",
      description: "Resolved complaints, kept on record for reference.",
      icon: CheckCircle2,
      tone: "success" as const,
      path: "/dashboard/complaints/completed",
      count: completedCount,
    },
    {
      key: "search-complaint",
      title: "Search Complaint",
      description: "Find a specific complaint by its ID.",
      icon: Search,
      tone: "primary" as const,
      path: "/dashboard/complaints/search",
    },
  ];

  return (
    <>
      <PageHeader title="Complaint Management" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]} />

      <PageContainer width="hub">
        <p className="text-sm text-gray">Track, assign, and resolve customer complaints.</p>

        <div className="mt-8 flex flex-wrap gap-5">
          {LINK_CARDS.map(({ key, title, description, icon, tone, path, count }) => (
            <div key={key} className="min-w-72 flex-1">
              <LinkCard
                title={title}
                description={description}
                icon={icon}
                tone={tone}
                count={count}
                onClick={() => navigate(path)}
              />
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
