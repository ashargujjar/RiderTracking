import { Schema, model, type InferSchemaType } from "mongoose";

// Mirrors the section/field layout in webFrontend/src/data/clientFormSections.ts
// (route: /dashboard/clients/new) — required fields there are required here too.

const clientInfoSchema = new Schema(
  {
    site: { type: String, required: true, trim: true },
    sp: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    fileNo: { type: String, trim: true },
    fileDate: { type: Date },
    licenseIssueDate: { type: Date },
    meterNo: { type: String, trim: true },
    contactNo: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
  },
  { _id: false }
);

const wiringFrameSchema = new Schema(
  {
    visitDate: { type: Date },
    equipDeliveryDate: { type: Date },
    engIncharge: { type: String, trim: true },
    teamIncharge: { type: String, trim: true },
    resp: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    timeDays: { type: Number },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"] },
  },
  { _id: false }
);

const panelInfoSchema = new Schema(
  {
    brand: { type: String, trim: true },
    wattPerPlate: { type: Number },
    qty: { type: Number },
    totalKw: { type: Number },
  },
  { _id: false }
);

const batteryInfoSchema = new Schema(
  {
    type: { type: String, trim: true },
    qty: { type: Number },
  },
  { _id: false }
);

const inverterInfoSchema = new Schema(
  {
    type: { type: String, trim: true },
    qty: { type: Number },
    dongleSn: { type: String, trim: true },
    serialNo: { type: String, trim: true },
  },
  { _id: false }
);

const structureInfoSchema = new Schema(
  {
    panelsOnShed: { type: Number },
    kwShed: { type: Number },
    shedStart: { type: Date },
    shedEnd: { type: Date },
    shedInstalled: { type: Date },
    resp: { type: String, trim: true },
    panelsOnElevated: { type: Number },
    kwElevated: { type: Number },
    kwFixed: { type: Number },
  },
  { _id: false }
);

const qcCommissioningSchema = new Schema(
  {
    date: { type: Date },
    siteCleared: { type: String, enum: ["Yes", "No"] },
    commissioningDate: { type: Date },
    commissioningStatus: { type: String, enum: ["Pending", "In Progress", "Completed"] },
    remarks: { type: String },
  },
  { _id: false }
);

const concludingRemarksSchema = new Schema(
  {
    concludingRemarks: { type: String },
  },
  { _id: false }
);

const clientSchema = new Schema(
  {
    client: { type: clientInfoSchema, required: true },
    wiring: { type: wiringFrameSchema, default: {} },
    panel: { type: panelInfoSchema, default: {} },
    battery: { type: batteryInfoSchema, default: {} },
    inverter: { type: inverterInfoSchema, default: {} },
    structure: { type: structureInfoSchema, default: {} },
    qc: { type: qcCommissioningSchema, default: {} },
    remarks: { type: concludingRemarksSchema, default: {} },
    // Expo push token for this client's mobile app session — set via
    // PUT /clients/me/push-token once they grant notification permission.
    // Used to notify them when their rider starts heading their way.
    expoPushToken: { type: String, trim: true },
  },
  { timestamps: true }
);

export type ClientDocument = InferSchemaType<typeof clientSchema>;
export const Client = model("Client", clientSchema);