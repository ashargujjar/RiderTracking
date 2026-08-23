import type { ApiClientDoc, ClientPayload } from "../api/clientsApi";
import { SECTIONS, type ClientValues } from "../data/clientFormSections";
import type { ClientSummary } from "../data/mockClients";

export function apiClientToValues(doc: ApiClientDoc): ClientValues {
  const values = {} as ClientValues;

  for (const section of SECTIONS) {
    const sectionData = (doc[section.key] ?? {}) as Record<string, unknown>;
    const sectionValues: Record<string, string> = {};

    for (const field of section.fields) {
      const raw = sectionData[field.key];
      if (raw === undefined || raw === null) {
        sectionValues[field.key] = "";
      } else if (field.type === "date") {
        sectionValues[field.key] = String(raw).slice(0, 10);
      } else {
        sectionValues[field.key] = String(raw);
      }
    }

    values[section.key] = sectionValues;
  }

  return values;
}

export function valuesToApiPayload(values: ClientValues): ClientPayload {
  const payload: ClientPayload = {};

  for (const section of SECTIONS) {
    const sectionValues = values[section.key];
    const cleaned: Record<string, string> = {};

    for (const [key, value] of Object.entries(sectionValues)) {
      if (value.trim() !== "") cleaned[key] = value;
    }

    payload[section.key] = cleaned;
  }

  return payload;
}

export function getApiClientSummary(doc: ApiClientDoc): ClientSummary {
  const client = doc.client as Record<string, unknown>;
  const wiring = doc.wiring as Record<string, unknown>;

  return {
    id: doc._id,
    site: (client.site as string) || "Untitled Client",
    location: (client.location as string) || "—",
    contactNo: (client.contactNo as string) || "—",
    fileNo: (client.fileNo as string) || "—",
    username: (client.username as string) || "—",
    status: (wiring?.status as string) || "Not Started",
  };
}
