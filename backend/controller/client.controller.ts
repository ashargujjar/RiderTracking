import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { isValidObjectId, mongo } from "mongoose";
import { ZodError } from "zod";

import { Client } from "../model/client.model";
import {
  clientLoginSchema,
  createClientSchema,
  editClientSchema,
  listClientsQuerySchema,
  updateClientPushTokenSchema,
} from "../schemas/client.zod";

function isDuplicateUsernameError(error: unknown): boolean {
  return (
    error instanceof mongo.MongoServerError &&
    error.code === 11000 &&
    Object.keys(error.keyPattern ?? {}).includes("client.username")
  );
}

export async function createClient(req: Request, res: Response) {
  try {
    const input = createClientSchema.parse(req.body);
    const client = await Client.createClient(input);
    res.status(201).json({ success: true, client });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    if (isDuplicateUsernameError(error)) {
      res
        .status(409)
        .json({ success: false, message: "Username already taken", errors: { "client.username": ["Username already taken"] } });
      return;
    }
    console.error("Failed to create client:", error);
    res.status(500).json({ success: false, message: "Failed to create client" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = clientLoginSchema.parse(req.body);

    const client = await Client.login(username, password);
    if (!client) {
      res.status(401).json({ success: false, message: "Invalid username or password" });
      return;
    }

    const token = jwt.sign(
      { id: client._id.toString(), role: "client" },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    res.status(200).json({ success: true, token, client });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Client login failed:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}

export async function updateMyPushToken(req: Request, res: Response) {
  try {
    const { token } = updateClientPushTokenSchema.parse(req.body);
    const clientId = res.locals.clientId as string;
    await Client.updatePushToken(clientId, token);
    res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to update push token:", error);
    res.status(500).json({ success: false, message: "Failed to update push token" });
  }
}

export async function getAllClients(req: Request, res: Response) {
  try {
    const { page, search } = listClientsQuerySchema.parse(req.query);
    const result = await Client.getAllClients(page, search);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid query", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to fetch clients:", error);
    res.status(500).json({ success: false, message: "Failed to fetch clients" });
  }
}

export async function getClient(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid client id" });
      return;
    }

    const client = await Client.getClientById(id);
    if (!client) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.status(200).json({ success: true, client });
  } catch (error) {
    console.error("Failed to fetch client:", error);
    res.status(500).json({ success: false, message: "Failed to fetch client" });
  }
}

export async function getClientStats(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid client id" });
      return;
    }

    const stats = await Client.getComplaintStats(id);
    if (!stats) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.status(200).json({ success: true, ...stats });
  } catch (error) {
    console.error("Failed to fetch client stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch client stats" });
  }
}

export async function editClient(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid client id" });
      return;
    }

    const input = editClientSchema.parse(req.body);
    const updatedClient = await Client.editClient(id, input);
    if (!updatedClient) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.status(200).json({ success: true, client: updatedClient });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    if (isDuplicateUsernameError(error)) {
      res
        .status(409)
        .json({ success: false, message: "Username already taken", errors: { "client.username": ["Username already taken"] } });
      return;
    }
    console.error("Failed to edit client:", error);
    res.status(500).json({ success: false, message: "Failed to edit client" });
  }
}

export async function deleteClient(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid client id" });
      return;
    }

    const deletedClient = await Client.deleteClient(id);
    if (!deletedClient) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Client deleted successfully", client: deletedClient });
  } catch (error) {
    console.error("Failed to delete client:", error);
    res.status(500).json({ success: false, message: "Failed to delete client" });
  }
}