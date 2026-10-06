// ─── BYOS (Bring Your Own Storage) ───────────────────────────────────────────
// Per-user storage connections. A user connects their own Google Drive; their
// document uploads then route to their Drive instead of platform disk. Mirrors
// the BYOK credential model (see ./byok.types.ts) but scoped per-user.

export type ByosProvider = "gdrive";

export interface ByosStatus {
  connected: boolean;
  provider: ByosProvider;
  // Present only when connected (from the backend's public projection).
  id?: number;
  accountEmail?: string | null;
  status?: string;
  lastUsedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ByosConnectResponse {
  authUrl: string;
  provider: ByosProvider;
}

export interface ByosDisconnectResponse {
  connected: boolean;
  provider: ByosProvider;
}
