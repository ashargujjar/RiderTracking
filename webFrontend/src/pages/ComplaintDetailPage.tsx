import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
  ZoomIn,
  X,
} from "lucide-react";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { SectionTabNav } from "../components/SectionTabNav";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { useSimulatedLoading } from "../hooks/useSimulatedLoading";
import {
  getCarriedOverDue,
  getClientUnpaidComplaints,
  MOCK_COMPLAINTS,
  type ComplaintStatus,
  type PaymentStatus,
} from "../data/mockComplaints";
import { complaintStatusTone, paymentStatusTone } from "../data/statusStyles";
import { getClientSummary, MOCK_CLIENTS } from "../data/mockClients";
import { MOCK_RIDERS } from "../data/mockRiders";
import { getPlaceholderPhoto } from "../utils/placeholderPhoto";

const STATUS_OPTIONS: ComplaintStatus[] = ["Pending", "In Progress", "Resolved"];

const NAV_SECTIONS = [
  { id: "complaint-info", label: "Complaint Info", icon: ClipboardList },
  { id: "assignment-payment", label: "Assignment & Payment", icon: Wallet },
  { id: "client-info", label: "Client Info", icon: Users },
] as const;

function InfoField({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <p className="text-xs font-semibold text-text-dark">{label}</p>
      <p className="mt-0.5 text-sm text-text-darker">{value || "—"}</p>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const complaint = MOCK_COMPLAINTS.find((item) => item.id === id);
  const client = complaint ? MOCK_CLIENTS.find((item) => item.id === complaint.clientId) : undefined;
  const clientSummary = client ? getClientSummary(client) : undefined;
  const isLoading = useSimulatedLoading();
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

  const [statusInput, setStatusInput] = useState<ComplaintStatus>(complaint?.status ?? "Pending");
  const [assignedToInput, setAssignedToInput] = useState<string>(complaint?.assignedTo ?? "Unassigned");
  const assignedRider = MOCK_RIDERS.find((rider) => rider.name === assignedToInput);
  const [amountDueInput, setAmountDueInput] = useState<string>(String(complaint?.amountDue ?? 0));
  const [paymentStatusInput, setPaymentStatusInput] = useState<PaymentStatus>(complaint?.paymentStatus ?? "Unpaid");
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [isPaymentSaved, setIsPaymentSaved] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [isAdminSaved, setIsAdminSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(NAV_SECTIONS[0].id);

  useEffect(() => {
    if (!complaint || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    const elements = NAV_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [complaint, isLoading]);

  const unpaidHistory = complaint ? getClientUnpaidComplaints(complaint.clientId, complaint.id) : [];
  const carriedOverDue = complaint ? getCarriedOverDue(complaint.clientId, complaint.id) : 0;

  if (!complaint) {
    return (
      <>
        <PageHeader
          title="Complaint Details"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Complaints", to: "/dashboard/complaints" }]}
        />
        <PageContainer width="compact">
          <EmptyState
            icon={ClipboardList}
            title={`No complaint found with id "${id}".`}
            actionLabel="Back to Complaints"
            onAction={() => navigate("/dashboard/complaints")}
          />
        </PageContainer>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Complaint Details"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Complaints", to: "/dashboard/complaints" }]}
        />
        <PageContainer width="detail">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  const showPrev = () =>
    setActivePhoto((current) => (current === null ? current : (current - 1 + complaint.photoCount) % complaint.photoCount));
  const showNext = () =>
    setActivePhoto((current) => (current === null ? current : (current + 1) % complaint.photoCount));

  const scrollToSection = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const parsedAmountDue = Math.max(0, Math.round(Number(amountDueInput) || 0));
  const totalPayable = parsedAmountDue + carriedOverDue;

  const handleSaveAdmin = () => {
    setIsAdminSaving(true);
    setTimeout(() => {
      complaint.status = statusInput;
      complaint.assignedTo = assignedToInput || "Unassigned";
      // A brand-new charge always starts out Unpaid — admin marks it Paid separately via the
      // Payment Status confirm control once the client actually pays.
      if (complaint.amountDue === 0 && parsedAmountDue > 0) {
        complaint.paymentStatus = "Unpaid";
        setPaymentStatusInput("Unpaid");
      }
      complaint.amountDue = parsedAmountDue;
      setAmountDueInput(String(parsedAmountDue));
      setIsAdminSaving(false);
      setIsAdminSaved(true);
      setTimeout(() => setIsAdminSaved(false), 1800);
    }, 600);
  };

  const handleConfirmPayment = () => {
    setIsPaymentSaving(true);
    setTimeout(() => {
      complaint.paymentStatus = paymentStatusInput;
      setIsPaymentSaving(false);
      setIsPaymentSaved(true);
      setTimeout(() => setIsPaymentSaved(false), 1800);
    }, 600);
  };

  return (
    <>
      <PageHeader
        title="Complaint Details"
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Complaints", to: "/dashboard/complaints" }]}
      />

      <PageContainer width="detail">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray">Complaint #{complaint.id}</p>
            <h1 className="mt-1 text-xl font-bold text-text-darker">{complaint.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge label={complaint.status} tone={complaintStatusTone(complaint.status)} />
            {(complaint.amountDue > 0 || carriedOverDue > 0) && (
              <StatusBadge
                label={complaint.amountDue > 0 ? complaint.paymentStatus : "Dues Pending"}
                tone={complaint.amountDue > 0 ? paymentStatusTone(complaint.paymentStatus) : "unpaid"}
              />
            )}
          </div>
        </div>

        {unpaidHistory.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-bold text-warning">
                This client has {unpaidHistory.length} unpaid complaint{unpaidHistory.length === 1 ? "" : "s"} — PKR{" "}
                {carriedOverDue.toLocaleString()} outstanding
              </p>
              <p className="mt-1 text-sm text-text-dark">
                {unpaidHistory
                  .map((item) => `#${item.id} (PKR ${item.amountDue.toLocaleString()})`)
                  .join(", ")}{" "}
                still awaiting payment. That balance is carried forward and added to this complaint's total payable
                below — the client must clear it before this one is settled.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 lg:hidden">
          <SectionTabNav
            sections={NAV_SECTIONS.map(({ id: sectionId, label }) => ({ id: sectionId, label }))}
            activeId={activeSection}
            onSelect={scrollToSection}
          />
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="hidden shrink-0 lg:block lg:w-56">
            <nav className="sticky top-6 flex flex-col gap-1 rounded-xl border border-border bg-white p-3 shadow-sm">
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wide text-gray">On This Page</p>
              {NAV_SECTIONS.map(({ id: sectionId, label, icon: Icon }) => (
                <button
                  key={sectionId}
                  type="button"
                  onClick={() => scrollToSection(sectionId)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    activeSection === sectionId
                      ? "bg-primary/10 text-primary"
                      : "text-text-dark hover:bg-background"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 max-w-3xl flex-1 space-y-6">
        <FormSection id="complaint-info" title="COMPLAINT INFORMATION">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoField label="Description" value={complaint.description} fullWidth />

            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-text-dark">
                Photos {complaint.photoCount > 0 && `(${complaint.photoCount})`}
              </p>
              {complaint.photoCount > 0 ? (
                <div className="mt-2 flex flex-wrap gap-3">
                  {Array.from({ length: complaint.photoCount }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActivePhoto(index)}
                      className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <img
                        src={getPlaceholderPhoto(index)}
                        alt={`Complaint photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-sm text-text-darker">No photos attached</p>
              )}
            </div>

            <InfoField label="Assigned To" value={complaint.assignedTo} />
            <InfoField label="Raised Date" value={complaint.raisedDate} />
            {complaint.resolvedDate && <InfoField label="Resolved Date" value={complaint.resolvedDate} />}
            {complaint.resolutionNotes && (
              <InfoField label="Resolution Notes" value={complaint.resolutionNotes} fullWidth />
            )}
          </div>
        </FormSection>

        <FormSection id="assignment-payment" title="ASSIGNMENT & PAYMENT" tone="success" icon={Wallet}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FormField
                  label="Timeline Status"
                  type="select"
                  value={statusInput}
                  options={STATUS_OPTIONS}
                  onChange={(value) => setStatusInput(value as ComplaintStatus)}
                />
              </div>
              <div>
                <FormField
                  label="Assign to Rider"
                  type="select"
                  value={assignedToInput === "Unassigned" ? "" : assignedToInput}
                  options={MOCK_RIDERS.map((rider) => rider.name)}
                  onChange={(value) => setAssignedToInput(value || "Unassigned")}
                />
                {assignedRider && (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/riders/${assignedRider.id}/tracking`)}
                    className="mt-1.5 flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" />
                    Track {assignedRider.name}'s live location
                  </button>
                )}
              </div>
              <FormField
                label="Amount to be Paid (PKR)"
                type="number"
                value={amountDueInput}
                onChange={setAmountDueInput}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-dark">Payment Status</label>
                {complaint.amountDue > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <select
                        value={paymentStatusInput}
                        onChange={(event) => setPaymentStatusInput(event.target.value as PaymentStatus)}
                        className="h-11 flex-1 rounded-lg border border-border px-3 text-sm text-text-darker outline-none focus:border-primary"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        disabled={isPaymentSaving || paymentStatusInput === complaint.paymentStatus}
                        className="flex h-11 min-w-24 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md shadow-primary/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPaymentSaving ? <Spinner /> : "Confirm"}
                      </button>
                    </div>
                    {isPaymentSaved && (
                      <span className="animate-scale-in flex items-center gap-1.5 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Payment status updated
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
                    <StatusBadge label="No Charge" tone="neutral" />
                    <span className="flex items-center gap-1 text-xs text-gray">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      No amount due yet
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(parsedAmountDue > 0 || carriedOverDue > 0) && (
              <div className="mt-5 rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-text-dark">Amount Summary</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-text-dark">This complaint's charge</span>
                  <span className="font-semibold text-text-darker">PKR {parsedAmountDue.toLocaleString()}</span>
                </div>
                {carriedOverDue > 0 && (
                  <div className="mt-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Carried over from unpaid history
                    </span>
                    <span className="font-semibold text-warning">PKR {carriedOverDue.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-bold text-text-darker">Total payable</span>
                  <span className="text-lg font-bold text-primary">PKR {totalPayable.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={handleSaveAdmin}
                disabled={isAdminSaving}
                className="flex h-11 min-w-36 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md shadow-primary/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isAdminSaving ? <Spinner /> : "Save Changes"}
              </button>
              {isAdminSaved && (
                <span className="animate-scale-in flex items-center gap-1.5 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Changes saved
                </span>
              )}
            </div>
        </FormSection>

        <FormSection id="client-info" title="CLIENT INFORMATION" tone="secondary">
            {clientSummary ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InfoField label="Site" value={clientSummary.site} />
                  <InfoField label="Location" value={clientSummary.location} />
                  <InfoField label="Contact No" value={clientSummary.contactNo} />
                  <InfoField label="Installation Status" value={clientSummary.status} />
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/clients/${clientSummary.id}`)}
                  className="mt-5 flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  View full client profile
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <p className="text-sm text-gray">No client record linked to this complaint.</p>
            )}
        </FormSection>
          </div>
        </div>
      </PageContainer>

      {activePhoto !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg" onClick={(event) => event.stopPropagation()}>
            <img
              src={getPlaceholderPhoto(activePhoto)}
              alt={`Complaint photo ${activePhoto + 1}`}
              className="max-h-[75vh] w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute -top-3 -right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-text-darker shadow-md"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {complaint.photoCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={showPrev}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-white">
                  {activePhoto + 1} / {complaint.photoCount}
                </span>
                <button
                  type="button"
                  onClick={showNext}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
