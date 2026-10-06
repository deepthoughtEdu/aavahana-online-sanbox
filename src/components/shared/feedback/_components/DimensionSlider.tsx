"use client";

import React, { useState } from "react";
import { cn } from "@/utils";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/shared/icons";
import type { RubricDimension } from "@/types/shared/feedback.types";

// Generic fallback anchors for rubrics that don't carry their own level labels.
const ANCHOR_ZONES = [
  { min: 0, max: 2, label: "Needs Support" },
  { min: 3, max: 4, label: "Developing" },
  { min: 5, max: 6, label: "Capable" },
  { min: 7, max: 8, label: "Strong" },
  { min: 9, max: 10, label: "Exceptional" },
];

function getAnchorLabel(value: number): string {
  return ANCHOR_ZONES.find((z) => value >= z.min && value <= z.max)?.label ?? "";
}

// Red (bottom third) / yellow (middle) / green (top third) bands for a level.
// Static class strings only (Design Surface Law — no dynamic class interpolation).
const RANGE_CLASS = {
  error: "range range-error",
  warning: "range range-warning",
  success: "range range-success",
} as const;
const BAND_TEXT = {
  error: "text-error",
  warning: "text-warning",
  success: "text-success",
} as const;
const BAND_BADGE = {
  error: "bg-error/10 text-error",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
} as const;

function bandFor(level: number, min: number, max: number): keyof typeof RANGE_CLASS {
  const pos = (level - min) / ((max - min) || 1);
  if (pos < 1 / 3) return "error";
  if (pos < 2 / 3) return "warning";
  return "success";
}

interface DimensionSliderProps {
  dimension: RubricDimension;
  value: number;
  onChange(value: number): void;
  disabled?: boolean;
  comment?: string;
  onCommentChange?(value: string): void;
}

export function DimensionSlider({ dimension, value, onChange, disabled, comment, onCommentChange }: DimensionSliderProps) {
  const { scale } = dimension;
  const currentVal = value || scale.min;
  const labels = scale.labels;
  const [showGuide, setShowGuide] = useState(false);

  const commentField = onCommentChange ? (
    <div className="space-y-1.5 pt-2 border-t border-base-200">
      <label className="text-sm font-semibold text-black">
        Add a suggestion <span className="text-xs font-normal text-neutral">(optional)</span>
      </label>
      <textarea
        rows={3}
        maxLength={280}
        value={comment ?? ""}
        onChange={(e) => onCommentChange(e.target.value)}
        disabled={disabled}
        placeholder="What should they keep doing, or do differently?"
        className="w-full text-sm border border-base-300 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
      />
      <p className="text-right text-[10px] text-neutral">{(comment ?? "").length}/280</p>
    </div>
  ) : null;

  // Labeled-level mode — the rubric carries its own anchors (e.g. the holistic
  // 1–10 scale). Horizontal DaisyUI range, banded red/yellow/green, with the
  // selected level's band + name + description live, and an expandable full-scale
  // reference so the giver can see what every level means.
  if (labels && labels.length) {
    const band = bandFor(currentVal, scale.min, scale.max);
    const idx = currentVal - scale.min;
    const currentLabel = labels[idx] ?? "";
    const currentDesc = scale.descriptions?.[idx];
    const currentBandName = scale.bands?.find((b) => currentVal >= b.min && currentVal <= b.max)?.name;

    return (
      <div className="space-y-2">
        {dimension.description && (
          <p className="text-xs dt-text-muted">{dimension.description}</p>
        )}

        <div className="flex items-baseline gap-2 flex-wrap">
          {currentBandName && (
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded", BAND_BADGE[band])}>
              {currentBandName}
            </span>
          )}
          <span className={cn("text-xl font-bold leading-none", BAND_TEXT[band])}>{currentVal}</span>
          <span className={cn("text-sm font-medium", BAND_TEXT[band])}>{currentLabel}</span>
        </div>
        {currentDesc && <p className="text-xs text-neutral leading-relaxed">{currentDesc}</p>}

        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={scale.step ?? 1}
          value={currentVal}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn("w-full", RANGE_CLASS[band])}
        />

        <div className="flex w-full justify-between px-1.5 text-[10px] text-[var(--dt-textDim)]">
          {labels.map((_, i) => (
            <span key={scale.min + i}>{scale.min + i}</span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="text-xs font-medium text-primary flex items-center gap-1"
        >
          {showGuide ? (<>Hide full scale <ChevronUpIcon size="sm" /></>) : (<>View full scale <ChevronDownIcon size="sm" /></>)}
        </button>

        {showGuide && (
          <div className="rounded-lg border border-base-300 divide-y divide-base-200 text-xs">
            {(scale.bands ?? []).map((b) => {
              const tone = bandFor(b.min, scale.min, scale.max);
              return (
                <div key={b.name} className="p-2.5">
                  <p className={cn("font-semibold mb-1.5", BAND_TEXT[tone])}>
                    {b.name} <span className="font-normal opacity-70">({b.min}–{b.max})</span>
                  </p>
                  <ul className="space-y-1">
                    {labels.map((label, i) => {
                      const lvl = scale.min + i;
                      if (lvl < b.min || lvl > b.max) return null;
                      return (
                        <li key={lvl} className="text-neutral leading-relaxed">
                          <span className="font-medium text-black">{lvl} · {label}</span>
                          {scale.descriptions?.[i] ? <>: {scale.descriptions[i]}</> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {commentField}
      </div>
    );
  }

  // Fallback — generic 0–N DaisyUI range with the hardcoded anchor zones.
  const anchorLabel = getAnchorLabel(currentVal);
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-black">{dimension.name}</p>
          {dimension.description && (
            <p className="text-xs dt-text-muted mt-0.5">{dimension.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-[var(--dt-textDim)]">wt {Math.round(dimension.weight * 100)}%</span>
          <span className="inline-flex items-center justify-center w-9 h-7 rounded-lg bg-primary/10 text-primary text-sm font-bold">
            {currentVal}
          </span>
        </div>
      </div>

      <input
        type="range"
        min={scale.min}
        max={scale.max}
        step={scale.step ?? 1}
        value={currentVal}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-primary w-full"
      />

      <div className="flex justify-between text-[10px] text-[var(--dt-textDim)]">
        {ANCHOR_ZONES.map((z) => (
          <span
            key={z.label}
            className={anchorLabel === z.label ? "text-primary font-semibold" : ""}
          >
            {z.label}
          </span>
        ))}
      </div>

      {commentField}
    </div>
  );
}
