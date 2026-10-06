"use client";

import { LndBlockEngine } from "@/components/lnd";
import { THE_BOARD } from "@/components/lnd/data/blocks/the-board";

export default function LndPage() {
  return <LndBlockEngine block={THE_BOARD} />;
}
