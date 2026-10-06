"use client";

import { useAtomValue } from "jotai";
import { navAccessAtom } from "@/lib/store/auth";
import type { NavAccess } from "@/types/shared/nav.types";

/**
 * The access context every navigation surface filters against.
 *
 * ⚠️ DISPLAY FILTERING ONLY — it hides links, it does not protect pages. See the
 * warning block on `NavAccess` in src/types/shared/nav.types.ts.
 */
export function useNavAccess(): NavAccess {
  return useAtomValue(navAccessAtom);
}
