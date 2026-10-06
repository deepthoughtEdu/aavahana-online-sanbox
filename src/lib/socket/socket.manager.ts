// src/lib/socket/socket.manager.ts
//
// Singleton Socket.IO client that connects directly to NodeBB.
// Auth is handled by the express.sid session cookie (withCredentials: true).
// Org context is passed via the `auth` handshake payload so NodeBB middleware
// can set req.organisation on the socket session.
//
// Usage:
//   import { socketManager } from "@/lib/socket/socket.manager";
//   const socket = await socketManager.connect(orgId);

import { io, Socket } from "socket.io-client";

type AnyHandler = (...args: unknown[]) => void;

async function fetchCsrfToken(): Promise<string> {
  // Fetch via Next.js API proxy (same-origin) to avoid CORS issues
  const res = await fetch("/api/config", { credentials: "include" });
  if (!res.ok) return "";
  const cfg = await res.json();
  return cfg.csrf_token ?? "";
}

class SocketManager {
  private socket: Socket | null = null;
  private currentOrgId: string | null = null;
  private connecting: Promise<Socket> | null = null;

  /**
   * Connect (or return the existing live connection).
   * Reconnects if the orgId changes.
   */
  async connect(orgId?: string): Promise<Socket> {
    if (this.socket?.connected && orgId === this.currentOrgId) {
      return this.socket;
    }

    // If already connecting, return the in-flight promise
    if (this.connecting) return this.connecting;

    this.connecting = this._connect(orgId);
    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  private async _connect(orgId?: string): Promise<Socket> {
    // Tear down stale connection before creating a new one
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentOrgId = orgId ?? null;

    const url = process.env.NEXT_PUBLIC_BASE_API_URL;
    if (!url) {
      throw new Error("[SocketManager] NEXT_PUBLIC_BASE_API_URL is not set");
    }

    // NodeBB's socket.io allowRequest checks CSRF — fetch token via Next.js proxy
    const csrfToken = await fetchCsrfToken();

    this.socket = io(url, {
      // Send express.sid cookie — NodeBB authenticates via passport/session
      withCredentials: true,

      // Start with polling (works through all proxies), then upgrade to WebSocket
      transports: ["polling", "websocket"],

      // NodeBB's default Socket.IO mount path
      path: "/socket.io",

      // CSRF token required by NodeBB's allowRequest
      query: csrfToken ? { _csrf: csrfToken } : {},

      // Pass org context at handshake so NodeBB's organizationContext middleware can read it
      auth: orgId ? { "x-organization-id": orgId } : {},

      // Standard reconnection settings
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentOrgId = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on(event: string, handler: AnyHandler): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler: AnyHandler): void {
    this.socket?.off(event, handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.socket?.emit(event, ...args);
  }
}

// Guard against SSR — socket.io-client must only run in the browser
export const socketManager =
  typeof window !== "undefined" ? new SocketManager() : null;
