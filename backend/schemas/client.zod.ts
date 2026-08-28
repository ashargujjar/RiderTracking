import { z } from "zod";

// Mirrors schemas/client.schema.ts — required/optional matches the mongoose schema.

const clientInfoSchema = z.object({
  site: z.string().trim().min(1, "Site is required"),
  sp: z.string().trim().optional(),
  location: z.string().trim().min(1, "Location is required"),
  fileNo: z.string().trim().optional(),
  fileDate: z.coerce.date().optional(),
  licenseIssueDate: z.coerce.date().optional(),
  meterNo: z.string().trim().optional(),
  contactNo: z.string().trim().min(1, "Contact No is required"),
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const wiringFrameSchema = z
  .object({
    visitDate: z.coerce.date().optional(),
    equipDeliveryDate: z.coerce.date().optional(),
    engIncharge: z.string().trim().optional(),
    teamIncharge: z.string().trim().optional(),
    resp: z.string().trim().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    timeDays: z.coerce.number().optional(),
    status: z.enum(["Pending", "In Progress", "Completed"]).optional(),
  })
  .optional();

const panelInfoSchema = z
  .object({
    brand: z.string().trim().optional(),
    wattPerPlate: z.coerce.number().optional(),
    qty: z.coerce.number().optional(),
    totalKw: z.coerce.number().optional(),
  })
  .optional();

const batteryInfoSchema = z
  .object({
    type: z.string().trim().optional(),
    qty: z.coerce.number().optional(),
  })
  .optional();

const inverterInfoSchema = z
  .object({
    type: z.string().trim().optional(),
    qty: z.coerce.number().optional(),
    dongleSn: z.string().trim().optional(),
    serialNo: z.string().trim().optional(),
  })
  .optional();

const structureInfoSchema = z
  .object({
    panelsOnShed: z.coerce.number().optional(),
    kwShed: z.coerce.number().optional(),
    shedStart: z.coerce.date().optional(),
    shedEnd: z.coerce.date().optional(),
    shedInstalled: z.coerce.date().optional(),
    resp: z.string().trim().optional(),
    panelsOnElevated: z.coerce.number().optional(),
    kwElevated: z.coerce.number().optional(),
    kwFixed: z.coerce.number().optional(),
  })
  .optional();

const qcCommissioningSchema = z
  .object({
    date: z.coerce.date().optional(),
    siteCleared: z.enum(["Yes", "No"]).optional(),
    commissioningDate: z.coerce.date().optional(),
    commissioningStatus: z.enum(["Pending", "In Progress", "Completed"]).optional(),
    remarks: z.string().optional(),
  })
  .optional();

const concludingRemarksSchema = z
  .object({
    concludingRemarks: z.string().optional(),
  })
  .optional();

export const createClientSchema = z.object({
  client: clientInfoSchema,
  wiring: wiringFrameSchema,
  panel: panelInfoSchema,
  battery: batteryInfoSchema,
  inverter: inverterInfoSchema,
  structure: structureInfoSchema,
  qc: qcCommissioningSchema,
  remarks: concludingRemarksSchema,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const editClientSchema = createClientSchema.deepPartial();

export type EditClientInput = z.infer<typeof editClientSchema>;

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().trim().min(1).optional(),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

export const clientLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type ClientLoginInput = z.infer<typeof clientLoginSchema>;

export const updateClientPushTokenSchema = z.object({
  token: z.string().trim().min(1, "Push token is required"),
});

export type UpdateClientPushTokenInput = z.infer<typeof updateClientPushTokenSchema>;
