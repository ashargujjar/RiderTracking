import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bike, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { FormField, type FieldType } from "../components/FormField";
import { FormSection } from "../components/FormSection";
import { LoadingState } from "../components/LoadingState";
import { Spinner } from "../components/Spinner";
import { ApiError } from "../api/client";
import { createRider, getRiderById } from "../api/ridersApi";
import { RIDER_CATEGORIES, type RiderCategory } from "../data/mockRiders";

type FieldKey = "name" | "phone" | "category" | "username" | "password";

type RiderFieldConfig = {
  key: FieldKey;
  label: string;
  type: FieldType;
  required: boolean;
  options?: readonly string[];
  placeholder?: string;
  fullWidth?: boolean;
};

const PROFILE_FIELDS: RiderFieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Bilal Ahmed" },
  { key: "phone", label: "Phone", type: "tel", required: true, placeholder: "e.g. 0300-1234567" },
  {
    key: "category",
    label: "Category",
    type: "select",
    required: true,
    options: RIDER_CATEGORIES,
    fullWidth: true,
  },
];

export default function RiderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: "",
    phone: "",
    category: "",
    username: "",
    password: "",
  });
  const [isLoadingRider, setIsLoadingRider] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRiderById(id)
      .then((rider) => {
        setValues({
          name: rider.name,
          phone: rider.phone,
          category: rider.category,
          username: rider.username ?? "",
          password: "",
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoadingRider(false));
  }, [id]);

  if (isEditMode && isLoadingRider) {
    return (
      <>
        <PageHeader title="Edit Rider" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]} />
        <PageContainer width="form">
          <LoadingState />
        </PageContainer>
      </>
    );
  }

  if (isEditMode && notFound) {
    return (
      <>
        <PageHeader title="Edit Rider" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]} />
        <PageContainer width="form">
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

  const credentialFields: RiderFieldConfig[] = [
    { key: "username", label: "Username", type: "text", required: true, placeholder: "e.g. bilal.ahmed" },
    {
      key: "password",
      label: isEditMode ? "New Password" : "Password",
      type: "password",
      required: !isEditMode,
      placeholder: isEditMode ? "Leave blank to keep current password" : "Enter a secure password",
    },
  ];

  const handleChange = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isEditMode) {
      toast.error("Editing riders isn't supported yet — only adding new riders is wired to the server.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRider({
        name: values.name,
        phone: values.phone,
        category: values.category as RiderCategory,
        username: values.username,
        password: values.password,
      });
      setIsSubmitting(false);
      setIsSaved(true);
      toast.success("Rider added successfully");
      setTimeout(() => {
        navigate("/dashboard/riders/all");
      }, 700);
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof ApiError) {
        const firstFieldError = error.fieldErrors && Object.values(error.fieldErrors).flat().find(Boolean);
        toast.error(firstFieldError ?? error.message);
      } else {
        toast.error("Failed to add rider");
      }
    }
  };

  const pageTitle = isEditMode ? "Edit Rider" : "Add Rider";
  const submitLabel = isEditMode ? "Save Changes" : "Add Rider";

  return (
    <>
      <PageHeader
        title={pageTitle}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Riders", to: "/dashboard/riders" }]}
      />

      <PageContainer width="form">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FormSection title="RIDER INFORMATION" icon={Bike}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {PROFILE_FIELDS.map((field) => (
                <FormField
                  key={field.key}
                  label={field.label}
                  type={field.type}
                  required={field.required}
                  options={field.options}
                  placeholder={field.placeholder}
                  fullWidth={field.fullWidth}
                  value={values[field.key]}
                  onChange={(value) => handleChange(field.key, value)}
                />
              ))}
            </div>
          </FormSection>

          <FormSection title="ACCOUNT CREDENTIALS" icon={KeyRound} tone="secondary">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {credentialFields.map((field) => (
                <FormField
                  key={field.key}
                  label={field.label}
                  type={field.type}
                  required={field.required}
                  options={field.options}
                  placeholder={field.placeholder}
                  fullWidth={field.fullWidth}
                  value={values[field.key]}
                  onChange={(value) => handleChange(field.key, value)}
                />
              ))}
            </div>
          </FormSection>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || isSaved}
              className="flex h-11 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isSubmitting ? <Spinner /> : isSaved ? "Saved" : submitLabel}
            </button>
            {isSaved && (
              <span className="animate-scale-in flex items-center gap-1.5 text-sm font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" />
                Rider added successfully
              </span>
            )}
          </div>
        </form>

        {isEditMode && (
          <p className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-text-dark">
            Editing and deleting riders isn't wired to the server yet — only viewing and creating riders is
            currently supported.
          </p>
        )}
      </PageContainer>
    </>
  );
}
