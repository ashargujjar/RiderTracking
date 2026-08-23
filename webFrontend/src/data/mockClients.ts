import { SECTIONS, createEmptyClientValues, type ClientValues, type SectionKey } from "./clientFormSections";

export type ClientRecord = {
  id: string;
  values: ClientValues;
  whatsappSent: boolean;
};

export type ClientSummary = {
  id: string;
  site: string;
  location: string;
  contactNo: string;
  fileNo: string;
  username: string;
  status: string;
};

type SectionOverrides = Partial<Record<SectionKey, Partial<Record<string, string>>>>;

function buildClient(id: string, overrides: SectionOverrides, whatsappSent = false): ClientRecord {
  const empty = createEmptyClientValues();
  const values = Object.fromEntries(
    SECTIONS.map((section) => [
      section.key,
      { ...empty[section.key], ...(overrides[section.key] ?? {}) },
    ]),
  ) as ClientValues;
  return { id, values, whatsappSent };
}

export const MOCK_CLIENTS: ClientRecord[] = [
  buildClient(
    "1",
    {
      client: {
        site: "Al Noor Residence",
        sp: "Catkin",
        location: "DHA Phase 6, Karachi",
        contactNo: "0300-1234567",
        username: "alnoor.residence",
        password: "AlNoor@123",
      },
      wiring: {
        visitDate: "2025-12-23",
        teamIncharge: "Saif",
        resp: "Catkin",
        startDate: "2026-01-14",
        endDate: "2026-01-16",
        timeDays: "3",
        status: "Completed",
      },
      panel: { brand: "Yingli", wattPerPlate: "615", qty: "12", totalKw: "7.38" },
      inverter: { type: "Aotai 10KWOGTP", qty: "1" },
      structure: { kwFixed: "7.38" },
    },
    true,
  ),
  buildClient("2", {
    client: {
      site: "Green Valley Farmhouse",
      location: "Raiwind Road, Lahore",
      contactNo: "0321-9876543",
      username: "greenvalley.farm",
      password: "GreenValley@456",
    },
    wiring: { teamIncharge: "Bilal", resp: "Catkin", startDate: "2026-02-02", status: "In Progress" },
    panel: { brand: "Jinko", qty: "20", totalKw: "12.4" },
    battery: { type: "Lithium", qty: "2" },
  }),
  buildClient(
    "3",
    {
      client: {
        site: "Al Falah Textile Mills",
        location: "SITE Area, Faisalabad",
        contactNo: "0345-2345678",
        username: "alfalah.mills",
        password: "AlFalah@789",
      },
      wiring: { status: "Pending" },
    },
    true,
  ),
  buildClient("4", {
    client: {
      site: "Sunrise Public School",
      location: "Model Town, Multan",
      contactNo: "0333-7654321",
      username: "sunrise.school",
      password: "Sunrise@321",
    },
    wiring: { teamIncharge: "Hamza", resp: "Catkin", status: "In Progress" },
    panel: { brand: "Longi", qty: "16", totalKw: "9.9" },
    inverter: { type: "Solis 10K", qty: "1" },
  }),
  buildClient("5", {
    client: {
      site: "Riverside Apartments",
      location: "Clifton, Karachi",
      contactNo: "0312-4567890",
      username: "riverside.apts",
      password: "Riverside@654",
    },
    wiring: { status: "Completed", teamIncharge: "Saif", startDate: "2025-11-05", endDate: "2025-11-09" },
    panel: { brand: "Yingli", qty: "24", totalKw: "14.76" },
    battery: { type: "Lithium", qty: "4" },
    inverter: { type: "Aotai 20KWOGTP", qty: "1" },
  }),
  buildClient("6", {
    client: {
      site: "Blue Ridge Warehouse",
      location: "Sundar Industrial Estate, Lahore",
      contactNo: "0300-9988776",
      username: "blueridge.warehouse",
      password: "BlueRidge@987",
    },
  }),
];

export function getClientSummary(client: ClientRecord): ClientSummary {
  return {
    id: client.id,
    site: client.values.client.site || "Untitled Client",
    location: client.values.client.location || "—",
    contactNo: client.values.client.contactNo || "—",
    fileNo: client.values.client.fileNo || "—",
    username: client.values.client.username || "—",
    status: client.values.wiring.status || "Not Started",
  };
}

/** Marks a client's credentials as sent via WhatsApp — mutates the shared mock store directly. */
export function markClientWhatsappSent(clientId: string): void {
  const client = MOCK_CLIENTS.find((item) => item.id === clientId);
  if (client) client.whatsappSent = true;
}
