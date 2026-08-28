import { isValidObjectId, type FilterQuery } from "mongoose";

import { Client as ClientSchema, type ClientDocument } from "../schemas/client.schema";
import { Complaint } from "../schemas/complaint.schema";
import { WhatsappCredentialsCheck } from "../schemas/whatsappCredentialsCheck.schema";
import type { CreateClientInput, EditClientInput } from "../schemas/client.zod";

// Matches PAGE_SIZE_CLIENTS in webFrontend/src/data/constants.ts
const CLIENTS_PAGE_SIZE = 15;

const CLIENT_SECTIONS = [
  "client",
  "wiring",
  "panel",
  "battery",
  "inverter",
  "structure",
  "qc",
  "remarks",
] as const;

function buildSearchFilter(search: string): FilterQuery<ClientDocument> {
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const or: FilterQuery<ClientDocument>[] = [
    { "client.site": regex },
    { "client.location": regex },
    { "client.fileNo": regex },
    { "client.contactNo": regex },
    { "client.username": regex },
  ];
  if (isValidObjectId(search)) {
    or.push({ _id: search } as FilterQuery<ClientDocument>);
  }

  return { $or: or };
}

export class Client {
  static async createClient(input: CreateClientInput) {
    const client = await ClientSchema.create(input);
    return client.toObject();
  }

  static async login(username: string, password: string) {
    const client = await ClientSchema.findOne({ "client.username": username });
    if (!client) return null;

    if (client.client.password !== password) return null;

    return client.toObject();
  }

  static async updatePushToken(id: string, token: string) {
    await ClientSchema.updateOne({ _id: id }, { $set: { expoPushToken: token } });
  }

  static async getAllClients(page: number, search?: string) {
    const skip = (page - 1) * CLIENTS_PAGE_SIZE;
    const filter = search ? buildSearchFilter(search) : {};

    const [clients, totalCount] = await Promise.all([
      ClientSchema.find(filter).skip(skip).limit(CLIENTS_PAGE_SIZE).lean(),
      ClientSchema.countDocuments(filter),
    ]);

    const clientIds = clients.map((doc) => doc._id);
    const whatsappChecks = await WhatsappCredentialsCheck.find({
      clientId: { $in: clientIds },
    }).lean();
    const sentByClientId = new Map(
      whatsappChecks.map((check) => [check.clientId.toString(), check.sent])
    );

    const clientsWithWhatsapp = clients.map((client) => ({
      ...client,
      whatsappSent: sentByClientId.get(client._id.toString()) ?? false,
    }));

    return {
      clients: clientsWithWhatsapp,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / CLIENTS_PAGE_SIZE)),
      totalCount,
    };
  }

  static async getClientById(id: string) {
    const client = await ClientSchema.findById(id).lean();
    if (!client) return null;

    return client;
  }

  static async editClient(id: string, input: EditClientInput) {
    const client = await ClientSchema.findById(id);
    if (!client) return null;

    const current = client.toObject();
    for (const section of CLIENT_SECTIONS) {
      const sectionInput = input[section];
      if (sectionInput) {
        client.set(section, { ...current[section], ...sectionInput });
      }
    }

    await client.save();
    return client.toObject();
  }

  // Complaint counts for one client — powers the stat tiles on
  // webFrontend/src/pages/ClientViewPage.tsx. "pending" matches the same
  // not-yet-Resolved bucket used everywhere else (see complaint.model.ts).
  static async getComplaintStats(id: string) {
    const clientExists = await ClientSchema.exists({ _id: id });
    if (!clientExists) return null;

    const [totalCount, pendingCount, resolvedCount] = await Promise.all([
      Complaint.countDocuments({ clientId: id }),
      Complaint.countDocuments({ clientId: id, status: { $ne: "Resolved" } }),
      Complaint.countDocuments({ clientId: id, status: "Resolved" }),
    ]);

    return { totalCount, pendingCount, resolvedCount };
  }

  static async deleteClient(id: string) {
    const client = await ClientSchema.findById(id);
    if (!client) return null;

    await client.deleteOne();
    return client.toObject();
  }
}
