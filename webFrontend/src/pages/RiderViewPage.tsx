import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bike,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  KeyRound,
  ListChecks,
  MapPin,
  Pencil,
  Phone,
  Tag,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { getRiderById, getRiderStats, type RiderOrderStats } from "../api/ridersApi";
import type { RiderRecord } from "../data/mockRiders";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-dark">{label}</p>
      <p className="mt-0.5 text-sm text-text-darker">{value || "—"}</p>
    </div>
  );
}

export default function RiderViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<RiderRecord | null>(null);
  const [stats, setStats] = useState<RiderOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getRiderById(id)
      .then(setRider)
      .catch(() => setRider(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getRiderStats(id)
      .then(setStats)
      .catch(() => toast.error("Failed to load rider order stats"));
  }, [id]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Rider Profile"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]}
        />
        <PageContainer width="detail">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (!rider) {
    return (
      <>
        <PageHeader title="Rider Profile" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]} />
        <PageContainer width="detail">
          <EmptyState
            icon={Bike}
            title={`No rider found with id "${id}".`}
            actionLabel="Back to Riders"
            onAction={() => navigate("/dashboard/riders")}
          />
        </PageContainer>
      </>
    );
  }

  const STAT_TILES = [
    { key: "assigned", label: "Assigned Orders", value: stats?.assignedCount ?? 0, icon: ClipboardList, accent: "text-primary bg-primary/10" },
    { key: "totalCompleted", label: "Total Completed Orders", value: stats?.totalCompletedCount ?? 0, icon: ListChecks, accent: "text-success bg-success/10" },
    { key: "monthlyCompleted", label: "Completed This Month", value: stats?.monthlyCompletedCount ?? 0, icon: TrendingUp, accent: "text-secondary bg-secondary/10" },
    { key: "previousMonthCompleted", label: "Completed Last Month", value: stats?.previousMonthCompletedCount ?? 0, icon: CalendarClock, accent: "text-gray bg-gray/10" },
  ];

  const ORDER_LINKS = [
    {
      key: "assigned",
      title: "Assigned Orders",
      description: "All complaints ever assigned to this rider, sortable and paginated.",
      icon: ClipboardList,
      accent: "text-primary bg-primary/10",
      path: `/dashboard/riders/${rider.id}/orders/assigned`,
    },
    {
      key: "completed",
      title: "Completed Orders History",
      description: "Full history of orders this rider has resolved, sortable and paginated.",
      icon: ListChecks,
      accent: "text-success bg-success/10",
      path: `/dashboard/riders/${rider.id}/orders/completed`,
    },
  ];

  return (
    <>
      <PageHeader
        title={rider.name}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]}
      />

      <PageContainer width="detail">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-darker">{rider.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-dark">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray" />
                  {rider.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-gray" />
                  {rider.category}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/riders/${rider.id}/tracking`)}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-sm font-bold text-text-dark transition hover:bg-background"
            >
              <MapPin className="h-4 w-4" />
              Track Location
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/riders/${rider.id}/edit`)}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          {STAT_TILES.map(({ key, label, value, icon: Icon, accent }) => (
            <div key={key} className="flex min-w-45 flex-1 items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
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

        <div className="mt-6">
          <FormSection title="ACCOUNT CREDENTIALS" icon={KeyRound} tone="secondary">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoField label="Username" value={rider.username ?? ""} />
              <InfoField label="Password" value={rider.password ?? ""} />
            </div>
          </FormSection>
        </div>

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-gray">Order History</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {ORDER_LINKS.map(({ key, title, description, icon: Icon, accent, path }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              className="flex min-w-72 flex-1 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-text-darker">{title}</p>
                  <p className="mt-0.5 text-xs text-gray">{description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray" />
            </button>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
