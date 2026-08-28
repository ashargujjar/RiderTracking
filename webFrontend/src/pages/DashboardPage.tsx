import { useEffect, useState } from "react";
import { AlertCircle, Bike, CheckCircle2, ClipboardList, Users, Video, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { LinkCard, type LinkCardTone } from "../components/LinkCard";
import { Spinner } from "../components/Spinner";
import { getStats, type Stats } from "../api/statsApi";
import { MOCK_COMPLAINTS } from "../data/mockComplaints";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => toast.error("Failed to load dashboard stats"))
      .finally(() => setIsLoadingStats(false));
  }, []);

  const unpaidComplaintsCount = MOCK_COMPLAINTS.filter(
    (complaint) => complaint.amountDue > 0 && complaint.paymentStatus === "Unpaid",
  ).length;

  const STAT_TILES = [
    { key: "clients", label: "Total Clients", value: stats?.totalClients ?? 0, icon: Users, accent: "text-primary bg-primary/10" },
    { key: "riders", label: "Total Riders", value: stats?.totalRiders ?? 0, icon: Bike, accent: "text-secondary bg-secondary/10" },
    { key: "completedComplaints", label: "Completed Complaints", value: stats?.completedComplaints ?? 0, icon: CheckCircle2, accent: "text-success bg-success/10" },
    { key: "pendingComplaints", label: "Pending Complaints", value: stats?.pendingComplaints ?? 0, icon: AlertCircle, accent: "text-warning bg-warning/10" },
    { key: "unpaidComplaints", label: "Unpaid Complaints", value: unpaidComplaintsCount, icon: Wallet, accent: "text-warning bg-warning/10" },
  ];

  const quickActions: {
    key: string;
    title: string;
    description: string;
    icon: typeof Users;
    tone: LinkCardTone;
    path: string;
  }[] = [
    {
      key: "client-management",
      title: "Client Management",
      description: "Add, search, and view clients and their site details.",
      icon: Users,
      tone: "primary",
      path: "/dashboard/clients",
    },
    {
      key: "rider-management",
      title: "Rider Management",
      description: "Add, search, and view riders assigned to complaints.",
      icon: Bike,
      tone: "accent",
      path: "/dashboard/riders",
    },
    {
      key: "complaint-management",
      title: "Complaint Management",
      description: "Track, assign, and resolve customer complaints.",
      icon: ClipboardList,
      tone: "warning",
      path: "/dashboard/complaints",
    },
    {
      key: "payment-management",
      title: "Payment Management",
      description: "Set amounts due and track paid / unpaid complaints.",
      icon: Wallet,
      tone: "secondary",
      path: "/dashboard/payments",
    },
    {
      key: "guide-videos",
      title: "Guide Videos",
      description: "Manage the YouTube demo guides shown in the client app.",
      icon: Video,
      tone: "accent",
      path: "/dashboard/guide-videos",
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />

      <PageContainer width="detail">
        <p className="text-sm text-gray">Quick actions to manage your platform.</p>

        {isLoadingStats ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-white p-6 text-sm font-semibold text-gray shadow-sm">
            <Spinner className="h-5 w-5 border-2 border-border border-t-primary" />
            Loading dashboard stats...
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-4">
            {STAT_TILES.map(({ key, label, value, icon: Icon, accent }) => (
              <div
                key={key}
                className="animate-fade-in-up flex min-w-45 flex-1 items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-darker">{value}</p>
                  <p className="text-xs text-gray">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-gray">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {quickActions.map(({ key, title, description, icon, tone, path }) => (
            <LinkCard
              key={key}
              title={title}
              description={description}
              icon={icon}
              tone={tone}
              onClick={() => navigate(path)}
            />
          ))}
        </div>
      </PageContainer>
    </>
  );
}
