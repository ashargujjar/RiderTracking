import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Users } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { DeleteConfirm } from "../components/DeleteConfirm";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { SectionTabNav } from "../components/SectionTabNav";
import { Spinner } from "../components/Spinner";
import { ApiError } from "../api/client";
import { createClient, deleteClient, getClientById, updateClient } from "../api/clientsApi";
import { apiClientToValues, getApiClientSummary, valuesToApiPayload } from "../lib/clientMapping";
import { SECTIONS, createEmptyClientValues, type ClientValues, type SectionKey } from "../data/clientFormSections";

export default function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [activeSection, setActiveSection] = useState<SectionKey>(SECTIONS[0].key);
  const [values, setValues] = useState<ClientValues>(createEmptyClientValues);
  const [clientSite, setClientSite] = useState("");
  const [isLoadingClient, setIsLoadingClient] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);

  useEffect(() => {
    if (!id) return;
    getClientById(id)
      .then((doc) => {
        setValues(apiClientToValues(doc));
        setClientSite(getApiClientSummary(doc).site);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoadingClient(false));
  }, [id]);

  const handleChange = (section: SectionKey, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isEditMode && !confirmingSave) {
      setConfirmingSave(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = valuesToApiPayload(values);
      if (isEditMode && id) {
        await updateClient(id, payload);
      } else {
        await createClient(payload);
      }
      setIsSubmitting(false);
      setIsSaved(true);
      toast.success(isEditMode ? "Client updated successfully" : "Client saved successfully");
      setTimeout(() => {
        navigate("/dashboard/clients/all");
      }, 700);
    } catch (error) {
      setIsSubmitting(false);
      setConfirmingSave(false);
      if (error instanceof ApiError) {
        const firstFieldError = error.fieldErrors && Object.values(error.fieldErrors).flat().find(Boolean);
        toast.error(firstFieldError ?? error.message);
      } else {
        toast.error("Failed to save client");
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteClient(id);
      toast.success("Client deleted");
      navigate("/dashboard/clients/all");
    } catch {
      toast.error("Failed to delete client");
    }
  };

  if (isEditMode && isLoadingClient) {
    return (
      <>
        <PageHeader
          title="Edit Client"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]}
        />
        <PageContainer width="compact">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (isEditMode && notFound) {
    return (
      <>
        <PageHeader
          title="Edit Client"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]}
        />
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

  const currentSection = SECTIONS.find((section) => section.key === activeSection) ?? SECTIONS[0];
  const pageTitle = isEditMode ? "Edit Client" : "Add Customer";
  const submitLabel = isEditMode ? "Save Changes" : "Save Client";
  const savedLabel = isEditMode ? "Client updated successfully" : "Client saved successfully";

  const isSectionFilled = (section: SectionKey) =>
    Object.values(values[section]).some((value) => value.trim() !== "");

  return (
    <>
      <PageHeader
        title={pageTitle}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Clients", to: "/dashboard/clients" }]}
      />

      <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border bg-white px-4 py-3">
            <SectionTabNav
              sections={SECTIONS.map((section) => ({
                id: section.key,
                label: section.navLabel,
                filled: isSectionFilled(section.key),
              }))}
              activeId={activeSection}
              onSelect={setActiveSection}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="mx-auto max-w-6xl">
              <FormSection title={currentSection.title}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {currentSection.fields.map((field) => {
                    const isPassword = field.key === "password";
                    return (
                      <FormField
                        key={field.key}
                        label={field.label}
                        type={field.type}
                        required={isPassword ? !isEditMode : "required" in field ? field.required : undefined}
                        options={"options" in field ? field.options : undefined}
                        fullWidth={"fullWidth" in field ? field.fullWidth : undefined}
                        placeholder={
                          isPassword && isEditMode
                            ? "Leave blank to keep current password"
                            : "placeholder" in field
                              ? field.placeholder
                              : undefined
                        }
                        value={values[activeSection][field.key]}
                        onChange={(value) => handleChange(activeSection, field.key, value)}
                      />
                    );
                  })}
                </div>
              </FormSection>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-white px-8 py-4">
            <div className="flex items-center gap-4">
              {confirmingSave && !isSaved ? (
                <>
                  <span className="text-sm font-semibold text-text-darker">Save these changes?</span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-11 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {isSubmitting ? <Spinner /> : "Confirm Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingSave(false)}
                    disabled={isSubmitting}
                    className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border px-6 text-sm font-bold text-text-dark transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isSaved}
                  className="flex h-11 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSubmitting ? <Spinner /> : isSaved ? "Saved" : submitLabel}
                </button>
              )}
              {isSaved && (
                <span className="animate-scale-in flex items-center gap-1.5 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {savedLabel}
                </span>
              )}
            </div>

            {isEditMode && (
              <DeleteConfirm
                itemLabel="Client"
                variant="panel"
                panelTitle="Delete this client"
                panelDescription={`This removes ${clientSite || "this client"} from the client list.`}
                onConfirm={handleDelete}
              />
            )}
          </div>
        </div>
      </form>
    </>
  );
}
