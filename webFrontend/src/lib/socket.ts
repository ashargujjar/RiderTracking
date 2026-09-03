import { io, type Socket } from "socket.io-client";

import { getToken } from "../api/client";

const SOCKET_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

let socket: Socket | null = null;

// Lazily creates a single shared admin socket connection, authenticated with
// the same JWT used for REST calls (see backend/utils/socket.ts).
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      autoConnect: false,
    });
  }
  return socket;
}
