import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
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
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { SectionTabNav } from "../components/SectionTabNav";
import { Spinner } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { ApiError } from "../api/client";
import {
  getComplaintById,
  updateComplaint,
  type ComplaintDetail,
  type ComplaintStatus,
  type PaymentStatus,
} from "../api/complaintsApi";
import { complaintStatusTone, paymentStatusTone } from "../data/statusStyles";
import { getRiders } from "../api/ridersApi";
import type { RiderRecord } from "../data/mockRiders";

const NAV_SECTIONS = [
  { id: "complaint-info", label: "Complaint Info", icon: ClipboardList },
  { id: "assignment-payment", label: "Assignment & Payment", icon: Wallet },
  { id: "client-info", label: "Client Info", icon: Users },
] as const;

const STATUS_OPTIONS: ComplaintStatus[] = [
  "Pending",
  "Assigned",
  "On The Way",
  "Arrived",
  "Pending Approval",
  "Resolved",
];

function InfoField({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <p className="text-xs font-semibold text-text-dark">{label}</p>
      <p className="mt-0.5 text-sm text-text-darker">{value || "—"}</p>
    </div>
  );
}

function PhotoGrid({
  label,
  photos,
  onOpen,
}: {
  label: string;
  photos: string[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold text-text-dark">
        {label} {photos.length > 0 && `(${photos.length})`}
      </p>
      {photos.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => onOpen(index)}
              className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img src={url} alt={`${label} ${index + 1}`} className="h-full w-full object-cover" />
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
  );
}

export default function ComplaintDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(NAV_SECTIONS[0].id);
  const [activePhoto, setActivePhoto] = useState<{ gallery: "original" | "resolution"; index: number } | null>(
    null,
  );

  const [riders, setRiders] = useState<RiderRecord[]>([]);

  const [statusInput, setStatusInput] = useState<ComplaintStatus>("Pending");
  const [assignedToInput, setAssignedToInput] = useState<string>("");
  const [amountDueInput, setAmountDueInput] = useState<string>("0");
  const [paymentStatusInput, setPaymentStatusInput] = useState<PaymentStatus>("Unpaid");
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [isAdminSaved, setIsAdminSaved] = useState(false);
  const [isAmountSaving, setIsAmountSaving] = useState(false);
  const [isAmountSaved, setIsAmountSaved] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [isPaymentSaved, setIsPaymentSaved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getComplaintById(id)
      .then(setComplaint)
      .catch(() => toast.error("Failed to load complaint"))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    // Only the first page of riders is fetched for this dropdown — fine while
    // rider counts are small, but it'll silently miss riders past that.
    getRiders(1).then((data) => setRiders(data.riders)).catch(() => {
      // Non-fatal — the rider dropdown just won't have options.
    });
  }, []);

  useEffect(() => {
    if (!complaint) return;
    setStatusInput(complaint.status);
    setAssignedToInput(complaint.assignedTo?.id ?? "");
    setAmountDueInput(String(complaint.amountDue));
    setPaymentStatusInput(complaint.paymentStatus);
  }, [complaint]);

  const handleSaveAdmin = async () => {
    if (!complaint) return;
    setIsAdminSaving(true);
    try {
      const updated = await updateComplaint(complaint.id, {
        status: statusInput,
        assignedTo: assignedToInput || null,
      });
      setComplaint(updated);
      setIsAdminSaved(true);
      setTimeout(() => setIsAdminSaved(false), 1800);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save changes");
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleSaveAmount = async () => {
    if (!complaint) return;
    setIsAmountSaving(true);
    try {
      const parsedAmountDue = Math.max(0, Math.round(Number(amountDueInput) || 0));
      const updated = await updateComplaint(complaint.id, { amountDue: parsedAmountDue });
      setComplaint(updated);
      setIsAmountSaved(true);
      setTimeout(() => setIsAmountSaved(false), 1800);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update amount");
    } finally {
      setIsAmountSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!complaint) return;
    setIsApproving(true);
    try {
      setComplaint(await updateComplaint(complaint.id, { status: "Resolved" }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to approve complaint");
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!complaint) return;
    setIsPaymentSaving(true);
    try {
      const updated = await updateComplaint(complaint.id, { paymentStatus: paymentStatusInput });
      setComplaint(updated);
      setIsPaymentSaved(true);
      setTimeout(() => setIsPaymentSaved(false), 1800);
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setIsPaymentSaving(false);
    }
  };

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

  const isFinalized =
    complaint.status === "Resolved" && (complaint.amountDue === 0 || complaint.paymentStatus === "Paid");

  // Mirrors the server-side close-gate in Complaint.updateComplaint: a
  // genuinely priced, still-unpaid complaint can't be moved to Resolved.
  // Reads the last-saved complaint state, not the in-progress form inputs —
  // that's what the server actually evaluates against.
  const blocksResolve = complaint.isPriced && complaint.amountDue > 0 && complaint.paymentStatus !== "Paid";
  const statusOptions = blocksResolve ? STATUS_OPTIONS.filter((status) => status !== "Resolved") : STATUS_OPTIONS;

  const parsedAmountDue = Math.max(0, Math.round(Number(amountDueInput) || 0));
  const totalPayable = parsedAmountDue + complaint.carriedOverDue;

  const activeGallery = activePhoto?.gallery === "resolution" ? complaint.resolutionPhotos : complaint.photos;

  const showPrev = () =>
    setActivePhoto((current) =>
      current === null
        ? current
        : { ...current, index: (current.index - 1 + activeGallery.length) % activeGallery.length },
    );
  const showNext = () =>
    setActivePhoto((current) =>
      current === null ? current : { ...current, index: (current.index + 1) % activeGallery.length },
    );

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
            {complaint.amountDue > 0 && (
              <StatusBadge label={complaint.paymentStatus} tone={paymentStatusTone(complaint.paymentStatus)} />
            )}
          </div>
        </div>

        {complaint.status === "Pending Approval" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary/30 bg-secondary/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-sm font-bold text-secondary">Rider marked this complaint resolved</p>
                <p className="mt-1 text-sm text-text-dark">
                  Review the resolution notes and photos below, then approve to close it.
                </p>
                {blocksResolve && (
                  <p className="mt-1 text-xs font-semibold text-warning">
                    Outstanding balance must be marked Paid before this can be approved.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || blocksResolve}
              className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-bold text-white shadow-md shadow-secondary/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isApproving ? <Spinner /> : "Approve & Close"}
            </button>
          </div>
        )}

        <div className="mt-6">
          <SectionTabNav
            sections={NAV_SECTIONS.map(({ id: sectionId, label }) => ({ id: sectionId, label }))}
            activeId={activeSection}
            onSelect={setActiveSection}
          />
        </div>

        <div className="mt-6 min-w-0 max-w-3xl">
          {activeSection === "complaint-info" && (
            <FormSection id="complaint-info" title="COMPLAINT INFORMATION">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InfoField label="Description" value={complaint.description} fullWidth />

                <PhotoGrid
                  label="Photos"
                  photos={complaint.photos}
                  onOpen={(index) => setActivePhoto({ gallery: "original", index })}
                />

                <InfoField label="Assigned To" value={complaint.assignedTo?.name ?? "Unassigned"} />
                <InfoField label="Raised Date" value={complaint.raisedDate.slice(0, 10)} />
                {complaint.resolvedDate && (
                  <InfoField label="Resolved Date" value={complaint.resolvedDate.slice(0, 10)} />
                )}

                {complaint.timeline.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-text-dark">Status Timeline</p>
                    <div className="mt-2 flex flex-col gap-2.5 border-l-2 border-border pl-4">
                      {complaint.timeline.map((event, index) => (
                        <div key={`${event.status}-${event.at}-${index}`} className="flex items-center gap-3">
                          <StatusBadge label={event.status} tone={complaintStatusTone(event.status)} />
                          <span className="text-xs text-gray">
                            {new Date(event.at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {complaint.resolutionNotes && (
                  <InfoField label="Resolution Notes" value={complaint.resolutionNotes} fullWidth />
                )}

                {complaint.resolutionPhotos.length > 0 && (
                  <PhotoGrid
                    label="Resolution Photos — submitted by the rider"
                    photos={complaint.resolutionPhotos}
                    onOpen={(index) => setActivePhoto({ gallery: "resolution", index })}
                  />
                )}
              </div>
            </FormSection>
          )}

          {activeSection === "assignment-payment" && (
            <FormSection id="assignment-payment" title="ASSIGNMENT & PAYMENT" tone="success" icon={Wallet}>
              {isFinalized && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  This complaint is resolved and paid — all fields are locked.
                </div>
              )}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {isFinalized ? (
                  <InfoField label="Timeline Status" value={complaint.status} />
                ) : (
                  <FormField
                    label="Timeline Status"
                    type="select"
                    value={statusInput}
                    options={statusOptions}
                    onChange={(value) => setStatusInput(value as ComplaintStatus)}
                  />
                )}

                {isFinalized ? (
                  <InfoField label="Assigned Rider" value={complaint.assignedTo?.name ?? "Unassigned"} />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-dark">Assign to Rider</label>
                    <select
                      value={assignedToInput}
                      onChange={(event) => setAssignedToInput(event.target.value)}
                      className="h-11 rounded-lg border border-border px-3 text-sm text-text-darker outline-none focus:border-primary"
                    >
                      <option value="">Unassigned</option>
                      {riders.map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name} ({rider.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {complaint.assignedTo && (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/riders/${complaint.assignedTo!.id}/tracking`)}
                    className="-mt-3 flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline sm:col-start-2"
                  >
                    <MapPin className="h-3 w-3" />
                    Track {complaint.assignedTo.name}'s live location
                  </button>
                )}

                {isFinalized ? (
                  <InfoField label="Amount to be Paid (PKR)" value={complaint.amountDue.toLocaleString()} />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-dark">Amount to be Paid (PKR)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={amountDueInput}
                        onChange={(event) => setAmountDueInput(event.target.value)}
                        className="h-11 flex-1 rounded-lg border border-border px-3 text-sm text-text-darker outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAmount}
                        disabled={isAmountSaving || parsedAmountDue === complaint.amountDue}
                        className="flex h-11 min-w-24 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-md shadow-primary/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAmountSaving ? <Spinner /> : "Set Amount"}
                      </button>
                    </div>
                    {isAmountSaved && (
                      <span className="animate-scale-in flex items-center gap-1.5 text-xs font-semibold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Amount updated
                      </span>
                    )}
                  </div>
                )}
                <InfoField
                  label="Total Amount (PKR)"
                  value={(isFinalized ? complaint.totalAmount : totalPayable).toLocaleString()}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-dark">Payment Status</label>
                  {!complaint.isPriced ? (
                    <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
                      <StatusBadge label="Not yet priced" tone="neutral" />
                      <span className="flex items-center gap-1 text-xs text-gray">
                        Set an amount to bill this complaint
                      </span>
                    </div>
                  ) : complaint.amountDue === 0 ? (
                    <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3">
                      <StatusBadge label="No Charge" tone="neutral" />
                      <span className="flex items-center gap-1 text-xs text-gray">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Priced at zero — no amount due
                      </span>
                    </div>
                  ) : complaint.paymentStatus === "Paid" ? (
                    <div className="flex h-11 items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3">
                      <StatusBadge label="Paid" tone="paid" />
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Payment confirmed — locked
                      </span>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              {(parsedAmountDue > 0 || complaint.carriedOverDue > 0) && (
                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-text-dark">Amount Summary</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-text-dark">This complaint's charge</span>
                    <span className="font-semibold text-text-darker">PKR {parsedAmountDue.toLocaleString()}</span>
                  </div>
                  {complaint.carriedOverDue > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-warning">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Carried over from unpaid history
                      </span>
                      <span className="font-semibold text-warning">
                        PKR {complaint.carriedOverDue.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm font-bold text-text-darker">Total payable</span>
                    <span className="text-lg font-bold text-primary">PKR {totalPayable.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {!isFinalized && (
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
              )}
            </FormSection>
          )}

          {activeSection === "client-info" && (
            <FormSection id="client-info" title="CLIENT INFORMATION" tone="secondary">
              {complaint.client ? (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <InfoField label="Site" value={complaint.client.site} />
                    <InfoField label="Location" value={complaint.client.location} />
                    <InfoField label="Contact No" value={complaint.client.contactNo} />
                    <InfoField label="Installation Status" value={complaint.client.installationStatus ?? "Not Started"} />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/clients/${complaint.client!.id}`)}
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
          )}
        </div>
      </PageContainer>

      {activePhoto !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg" onClick={(event) => event.stopPropagation()}>
            <img
              src={activeGallery[activePhoto.index]}
              alt={`${activePhoto.gallery === "resolution" ? "Resolution" : "Complaint"} photo ${activePhoto.index + 1}`}
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

            {activeGallery.length > 1 && (
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
                  {activePhoto.index + 1} / {activeGallery.length}
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
