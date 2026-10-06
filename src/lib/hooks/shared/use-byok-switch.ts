"use client";

import { useCallback, useState } from "react";
import { isError } from "@/lib/api/client";
import {
  ByokPreflightService,
  readFailureDetail,
} from "@/lib/services/shared/byok-preflight.service";
import type {
  ByokPreflight,
  ByokFailureDetail,
} from "@/types/shared/byok-preflight.types";

/**
 * Provider-switch consent, shared by every interactive chat surface (D-4: AI
 * Shell, daily report chat, HCD chat, Knowledge Q&A).
 *
 * Two entry points:
 *   handleFailure(error, ctx) — a call came back out of quota. Opens the card.
 *   checkBeforeSend(ctx)      — optional warning before spending, when the
 *                               estimate exceeds what is left.
 *
 * Nothing here switches anything. Every one of those surfaces sends provider,
 * model and key on each request, so the switch is the caller re-sending with
 * different values after the operator picks. This hook decides when to ask,
 * gathers the numbers, and records the consent (D-2: always ask, per switch).
 */
export interface ByokSwitchContext {
  provider: string;
  model: string;
  /** Characters in the payload about to be re-sent. Sized server-side. */
  payloadChars?: number;
  /** Which chat is asking, for the audit row. */
  surface: string;
}

export interface ByokSwitchChoice {
  provider: string;
  model: string | null;
}

export function useByokSwitch() {
  const [preflight, setPreflight] = useState<ByokPreflight | null>(null);
  const [failure, setFailure] = useState<ByokFailureDetail | null>(null);
  const [context, setContext] = useState<ByokSwitchContext | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const close = useCallback(() => {
    setPreflight(null);
    setFailure(null);
    setContext(null);
  }, []);

  const load = useCallback(async (ctx: ByokSwitchContext) => {
    setIsChecking(true);
    try {
      const result = await ByokPreflightService.check({
        provider: ctx.provider,
        model: ctx.model,
        payloadChars: ctx.payloadChars,
      });
      if (isError(result)) return null;
      setPreflight(result);
      setContext(ctx);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Call this from a surface's error path. Returns true when it took ownership
   * of the error (the card is now open), false when the caller should show its
   * own message — an invalid key or an overloaded provider is not a switch
   * decision, and dressing it up as one would send someone to the wrong fix.
   */
  const handleFailure = useCallback(
    async (error: unknown, ctx: ByokSwitchContext): Promise<boolean> => {
      const detail = readFailureDetail(error);
      if (!detail || detail.kind !== "quota") return false;
      setFailure(detail);
      const loaded = await load(ctx);
      return loaded !== null;
    },
    [load]
  );

  /**
   * Same decision as handleFailure, for a surface that reports its failure in a
   * 200 body rather than by throwing. HCD chat does this deliberately: the
   * user's message is already saved, so the request is a partial success.
   */
  const handleFailureDetail = useCallback(
    async (detail: ByokFailureDetail | null | undefined, ctx: ByokSwitchContext): Promise<boolean> => {
      if (!detail || detail.kind !== "quota") return false;
      setFailure(detail);
      const loaded = await load(ctx);
      return loaded !== null;
    },
    [load]
  );

  /**
   * Optional pre-send check. Opens the card only when the payload provably does
   * not fit what is left. `fitsHeadroom === null` means unknown, and unknown is
   * not a reason to interrupt someone.
   */
  const checkBeforeSend = useCallback(
    async (ctx: ByokSwitchContext): Promise<boolean> => {
      const result = await load(ctx);
      if (!result || !result.current) {
        close();
        return false;
      }
      const blocked = result.current.exhausted || result.current.fitsHeadroom === false;
      if (!blocked) {
        close();
        return false;
      }
      setFailure({
        kind: "quota",
        provider: result.current.provider,
        model: result.current.model ?? ctx.model,
        resetAt: result.current.resetAt,
      });
      return true;
    },
    [load, close]
  );

  /** Record the operator's decision, then hand the choice back to the caller. */
  const confirmSwitch = useCallback(
    async (choice: ByokSwitchChoice): Promise<ByokSwitchChoice | null> => {
      if (!context) return null;
      await ByokPreflightService.recordSwitch({
        fromProvider: context.provider,
        fromModel: context.model,
        toProvider: choice.provider,
        toModel: choice.model,
        tokensResent: preflight?.estimate.inputTokens ?? 0,
        trigger: failure ? "quota" : "preflight",
        surface: context.surface,
      });
      close();
      return choice;
    },
    [context, preflight, failure, close]
  );

  return {
    /** Non-null while the card should be shown. */
    preflight,
    failure,
    context,
    isChecking,
    handleFailure,
    handleFailureDetail,
    checkBeforeSend,
    confirmSwitch,
    close,
  };
}
