import type { FieldType } from "../components/FormField";

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  fullWidth?: boolean;
  placeholder?: string;
};

type SectionConfig = {
  key: string;
  navLabel: string;
  title: string;
  fields: readonly FieldConfig[];
};

const CLIENT_INFO_FIELDS = [
  { key: "site", label: "Site", type: "text", required: true, placeholder: "e.g. Al Noor Residence" },
  { key: "sp", label: "SP", type: "text", placeholder: "e.g. Catkin" },
  {
    key: "location",
    label: "Location",
    type: "text",
    required: true,
    placeholder: "Full address — house/street, area, city (e.g. House 12, Street 5, DHA Phase 6, Lahore)",
  },
  { key: "fileNo", label: "File No", type: "text", placeholder: "e.g. FN-2026-014" },
  { key: "fileDate", label: "File Date", type: "date" },
  { key: "licenseIssueDate", label: "License Issue Date", type: "date" },
  { key: "meterNo", label: "Meter No", type: "text", placeholder: "e.g. 1234567890123" },
  { key: "contactNo", label: "Contact No", type: "tel", required: true, placeholder: "e.g. 0300-1234567" },
  { key: "username", label: "Username", type: "text", required: true, placeholder: "e.g. alnoor.residence" },
  { key: "password", label: "Password", type: "password", required: true, placeholder: "Enter a secure password" },
] as const satisfies readonly FieldConfig[];

const WIRING_FRAME_FIELDS = [
  { key: "visitDate", label: "Visit Date", type: "date" },
  { key: "equipDeliveryDate", label: "Equipment Delivery Date", type: "date" },
  { key: "engIncharge", label: "Eng Incharge", type: "text", placeholder: "e.g. Ali Raza" },
  { key: "teamIncharge", label: "Team Incharge", type: "text", placeholder: "e.g. Bilal" },
  { key: "resp", label: "Resp", type: "text", placeholder: "e.g. Catkin" },
  { key: "startDate", label: "Start Date", type: "date" },
  { key: "endDate", label: "End Date", type: "date" },
  { key: "timeDays", label: "Time (Days)", type: "number", placeholder: "e.g. 3" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Pending", "In Progress", "Completed"],
  },
] as const satisfies readonly FieldConfig[];

const PANEL_INFO_FIELDS = [
  { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Yingli" },
  { key: "wattPerPlate", label: "W/Plate", type: "number", placeholder: "e.g. 615" },
  { key: "qty", label: "Qty", type: "number", placeholder: "e.g. 12" },
  { key: "totalKw", label: "Total KW", type: "number", placeholder: "e.g. 7.38" },
] as const satisfies readonly FieldConfig[];

const BATTERY_INFO_FIELDS = [
  { key: "type", label: "Type", type: "text", placeholder: "e.g. Lithium" },
  { key: "qty", label: "Qty", type: "number", placeholder: "e.g. 2" },
] as const satisfies readonly FieldConfig[];

const INVERTER_INFO_FIELDS = [
  { key: "type", label: "Type", type: "text", placeholder: "e.g. Aotai 10KWOGTP" },
  { key: "qty", label: "Qty", type: "number", placeholder: "e.g. 1" },
  { key: "dongleSn", label: "Dongle SN", type: "text", placeholder: "e.g. DG-2026-0456" },
  { key: "serialNo", label: "Serial No", type: "text", placeholder: "e.g. SN-889201" },
] as const satisfies readonly FieldConfig[];

const STRUCTURE_INFO_FIELDS = [
  { key: "panelsOnShed", label: "Panels on Shed", type: "number", placeholder: "e.g. 8" },
  { key: "kwShed", label: "KW (Shed)", type: "number", placeholder: "e.g. 4.92" },
  { key: "shedStart", label: "Shed Start", type: "date" },
  { key: "shedEnd", label: "Shed End", type: "date" },
  { key: "shedInstalled", label: "Shed Installed", type: "date" },
  { key: "resp", label: "Resp", type: "text", placeholder: "e.g. Catkin" },
  { key: "panelsOnElevated", label: "Panels on Elevated", type: "number", placeholder: "e.g. 4" },
  { key: "kwElevated", label: "KW (Elevated)", type: "number", placeholder: "e.g. 2.46" },
  { key: "kwFixed", label: "KW (Fixed)", type: "number", placeholder: "e.g. 7.38" },
] as const satisfies readonly FieldConfig[];

const QC_COMMISSIONING_FIELDS = [
  { key: "date", label: "Date", type: "date" },
  { key: "siteCleared", label: "Site Cleared", type: "select", options: ["Yes", "No"] },
  { key: "commissioningDate", label: "Commissioning Date", type: "date" },
  {
    key: "commissioningStatus",
    label: "Commissioning Status",
    type: "select",
    options: ["Pending", "In Progress", "Completed"],
  },
  {
    key: "remarks",
    label: "Remarks",
    type: "textarea",
    fullWidth: true,
    placeholder: "Add any notes about the commissioning process...",
  },
] as const satisfies readonly FieldConfig[];

const CONCLUDING_REMARKS_FIELDS = [
  {
    key: "concludingRemarks",
    label: "Concluding Remarks",
    type: "textarea",
    fullWidth: true,
    placeholder: "Add any final remarks about this installation...",
  },
] as const satisfies readonly FieldConfig[];

export const SECTIONS = [
  { key: "client", navLabel: "Client Information", title: "CLIENT INFORMATION", fields: CLIENT_INFO_FIELDS },
  {
    key: "wiring",
    navLabel: "Wiring & Frame Installation",
    title: "WIRING + STD FRAME INSTALLATION INFO",
    fields: WIRING_FRAME_FIELDS,
  },
  { key: "panel", navLabel: "Panel Info", title: "PANEL INFO", fields: PANEL_INFO_FIELDS },
  { key: "battery", navLabel: "Battery Info", title: "BATTERY INFO", fields: BATTERY_INFO_FIELDS },
  { key: "inverter", navLabel: "Inverter Info", title: "INVERTER INFO", fields: INVERTER_INFO_FIELDS },
  {
    key: "structure",
    navLabel: "Structure Information",
    title: "STRUCTURE INFORMATION",
    fields: STRUCTURE_INFO_FIELDS,
  },
  {
    key: "qc",
    navLabel: "QC & Commissioning",
    title: "QC AND COMMISSIONING INFORMATION",
    fields: QC_COMMISSIONING_FIELDS,
  },
  {
    key: "remarks",
    navLabel: "Concluding Remarks",
    title: "CONCLUDING REMARKS",
    fields: CONCLUDING_REMARKS_FIELDS,
  },
] as const satisfies readonly SectionConfig[];

export type SectionKey = (typeof SECTIONS)[number]["key"];

export type ClientValues = Record<SectionKey, Record<string, string>>;

function initialSectionValues(fields: readonly FieldConfig[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.key, ""]));
}

export function createEmptyClientValues(): ClientValues {
  return Object.fromEntries(
    SECTIONS.map((section) => [section.key, initialSectionValues(section.fields)]),
  ) as ClientValues;
}
