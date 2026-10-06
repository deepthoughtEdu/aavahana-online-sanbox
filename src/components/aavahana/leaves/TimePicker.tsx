"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

interface TimePickerProps {
  label: string;
  /** 24-hour "HH:mm" value */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Anchor the popover to the right edge of the trigger (default: left). */
  alignRight?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,..55

interface Parsed {
  hour: number; // 1..12
  minute: number; // 0..59
  meridiem: "AM" | "PM";
}

function parse(value: string): Parsed {
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return { hour: 9, minute: 0, meridiem: "AM" };
  }
  const meridiem: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: hour12, minute: m, meridiem };
}

function format24(p: Parsed): string {
  let h = p.hour % 12;
  if (p.meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

function display(value: string): string {
  const { hour, minute, meridiem } = parse(value);
  return `${hour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

export function TimePicker({
  label,
  value,
  onChange,
  className,
  alignRight = false,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const current = parse(value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const update = (patch: Partial<Parsed>) => {
    onChange(format24({ ...current, ...patch }));
  };

  return (
    <div ref={wrapperRef} className={cn("relative flex-1", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-left",
          "hover:bg-base-100/60 transition-colors",
          open && "bg-base-100/60"
        )}
      >
        <span className="text-xs text-base-content/60 font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="ml-auto text-sm font-semibold tabular-nums">
          {display(value)}
        </span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 top-full mt-2 w-64",
            "bg-base-100 rounded-xl shadow-lg border border-base-300/50 p-3",
            alignRight ? "right-0" : "left-0"
          )}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-3">
            <div className="text-[10px] text-base-content/50 font-medium uppercase tracking-wider text-center">
              Hour
            </div>
            <div />
            <div className="text-[10px] text-base-content/50 font-medium uppercase tracking-wider text-center">
              Minute
            </div>

            <Column
              values={HOURS}
              selected={current.hour}
              onSelect={(v) => update({ hour: v })}
              format={(v) => String(v)}
            />
            <div className="flex items-center justify-center text-base-content/40 font-semibold pb-2">
              :
            </div>
            <Column
              values={MINUTES}
              selected={current.minute}
              onSelect={(v) => update({ minute: v })}
              format={(v) => String(v).padStart(2, "0")}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 pt-2 border-t border-base-300/50">
            {(["AM", "PM"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update({ meridiem: m })}
                className={cn(
                  "py-2 rounded-md text-sm font-semibold transition-colors",
                  current.meridiem === m
                    ? "bg-primary text-primary-content"
                    : "bg-base-200/60 hover:bg-base-200 text-base-content/70"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  values,
  selected,
  onSelect,
  format,
}: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="max-h-44 overflow-y-auto rounded scrollbar-thin">
      <div className="flex flex-col gap-0.5">
        {values.map((v) => {
          const isSelected = selected === v;
          return (
            <button
              key={v}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => onSelect(v)}
              className={cn(
                "px-2 py-1.5 text-sm rounded-md tabular-nums transition-colors text-center",
                isSelected
                  ? "bg-primary text-primary-content font-semibold"
                  : "hover:bg-base-200 text-base-content/70"
              )}
            >
              {format(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
