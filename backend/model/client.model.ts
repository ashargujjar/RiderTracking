import { isValidObjectId, type FilterQuery } from "mongoose";

import { Client as ClientSchema, type ClientDocument } from "../schemas/client.schema";
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
    const obj = client.toObject();
    const { password, ...clientInfoSafe } = obj.client;
    return { ...obj, client: clientInfoSafe };
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

    const safeClients = clients.map(({ client, ...rest }) => {
      const { password, ...clientInfoSafe } = client;
      return {
        ...rest,
        client: clientInfoSafe,
        whatsappSent: sentByClientId.get(rest._id.toString()) ?? false,
      };
    });

    return {
      clients: safeClients,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / CLIENTS_PAGE_SIZE)),
      totalCount,
    };
  }

  static async getClientById(id: string) {
    const client = await ClientSchema.findById(id).lean();
    if (!client) return null;

    const { password, ...clientInfoSafe } = client.client;
    return { ...client, client: clientInfoSafe };
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
    const obj = client.toObject();
    const { password, ...clientInfoSafe } = obj.client;
    return { ...obj, client: clientInfoSafe };
  }

  static async deleteClient(id: string) {
    const client = await ClientSchema.findById(id);
    if (!client) return null;

    await client.deleteOne();
    const obj = client.toObject();
    const { password, ...clientInfoSafe } = obj.client;
    return { ...obj, client: clientInfoSafe };
  }
}
