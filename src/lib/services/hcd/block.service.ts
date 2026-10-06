import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { McqBlockData } from "@/components/lnd/data/types";

export interface BlockListItem {
  id: number;
  frameworkKey: string;
  frameworkName: string;
  name: string;
  schemaKey: string;
  sourceType: string;
  sourceTitle: string;
  gridCellsCovered: string[];
  portfolioTag: string | null;
  primaryDomain: string | null;
  questionCount: number;
  /** Whether the current user has a completed assessment for this block. */
  completed: boolean;
}

export interface PromptItem {
  id: number;
  title: string;
  content: string;
  type: "starter" | "followup" | "diagnostic" | "system" | "coaching";
}

export interface FrameworkPrompts {
  frameworkKey: string;
  frameworkName: string;
  prompts: PromptItem[];
}

/** The minimum a reflection must be before the assessment can be finished. The server checks the same number. */
export const REFLECTION_MIN_CHARS = 250;

export interface RecordedReflection {
  instanceId: number;
  submittedAt: string;
}

const BASE = "/v3/pdgms/hcd/blocks";

export class HcdBlockService {
  /** Save the closing reflection for the caller's finished attempt at a block. */
  static async recordReflection(
    blockId: number,
    text: string
  ): Promise<ApiResult<RecordedReflection>> {
    return api.post<RecordedReflection>(`${BASE}/${blockId}/reflection`, { text });
  }

  static async list(): Promise<ApiResult<BlockListItem[]>> {
    return api.get<BlockListItem[]>(BASE);
  }

  static async get(blockId: number): Promise<ApiResult<McqBlockData>> {
    return api.get<McqBlockData>(`${BASE}/${blockId}`);
  }

  static async getPrompts(
    frameworkKey: string
  ): Promise<ApiResult<FrameworkPrompts>> {
    return api.get<FrameworkPrompts>(`${BASE}/prompts`, { frameworkKey });
  }
}
