import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ClipboardList, History, Pencil, Users } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { SectionTabNav } from "../components/SectionTabNav";
import { getClientById, type ApiClientDoc } from "../api/clientsApi";
import { apiClientToValues, getApiClientSummary } from "../lib/clientMapping";
import { SECTIONS } from "../data/clientFormSections";
import { getClientComplaintStats } from "../data/mockComplaints";

function InfoField({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <p className="text-xs font-semibold text-text-dark">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-text-darker">{value || "—"}</p>
    </div>
  );
}

export default function ClientViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<ApiClientDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].key);

  useEffect(() => {
    if (!id) return;
    getClientById(id)
      .then(setDoc)
      .catch(() => toast.error("Failed to load client"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Client Profile" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]} />
        <PageContainer width="detail">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (!doc) {
    return (
      <>
        <PageHeader title="Client Profile" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]} />
        <PageContainer width="compact">
          <EmptyState
            icon={Users}
            title={`No client found with id "${id}".`}
            actionLabel="Back to Clients"
            onAction={() => navigate("/dashboard/clients")}
          />
        </PageContainer>
      </>
    );
  }

  const summary = getApiClientSummary(doc);
  const values = apiClientToValues(doc);
  const stats = getClientComplaintStats(doc._id);
  const STAT_TILES = [
    { key: "total", label: "Total Complaints", value: stats.totalCount, icon: ClipboardList, accent: "text-primary bg-primary/10" },
    { key: "pending", label: "Pending Complaints", value: stats.pendingCount, icon: History, accent: "text-warning bg-warning/10" },
    { key: "resolved", label: "Resolved Complaints", value: stats.resolvedCount, icon: CheckCircle2, accent: "text-success bg-success/10" },
  ];

  const currentSection = SECTIONS.find((section) => section.key === activeSection) ?? SECTIONS[0];

  return (
    <>
      <PageHeader
        title={summary.site}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]}
      />

      <PageContainer width="detail">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-darker">{summary.site}</p>
              <p className="mt-1 text-sm text-text-dark">
                {summary.location} · {summary.contactNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/clients/${doc._id}/complaints`)}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-sm font-bold text-text-dark transition hover:bg-background"
            >
              <History className="h-4 w-4" />
              Complaint History
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/clients/${doc._id}/edit`)}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STAT_TILES.map(({ key, label, value, icon: Icon, accent }) => (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
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
          <SectionTabNav
            sections={SECTIONS.map((section) => ({ id: section.key, label: section.navLabel }))}
            activeId={activeSection}
            onSelect={setActiveSection}
          />
        </div>

        <div className="mt-6 min-w-0">
          <FormSection id={currentSection.key} title={currentSection.title}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {currentSection.fields
                .map((field) => (
                  <InfoField
                    key={field.key}
                    label={field.label}
                    fullWidth={"fullWidth" in field ? field.fullWidth : undefined}
                    value={values[currentSection.key][field.key]}
                  />
                ))}
            </div>
          </FormSection>
        </div>
      </PageContainer>
    </>
  );
}
