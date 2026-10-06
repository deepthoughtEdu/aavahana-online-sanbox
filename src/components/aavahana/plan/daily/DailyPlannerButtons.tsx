"use client";

import { useState } from "react";
import { History, Target, Paperclip, Plus, Check, Upload } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { toast } from "@/utils";
import { useApi } from "@/lib/hooks/shared/use-api";
import { isError } from "@/lib/api/client";
import { WeeklyPlanService } from "@/lib/services/aavahana/weekly-plan.service";
import type { DailyTask } from "@/types";

const DAY_LABEL: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

type Panel = "unfinished" | "building" | "context" | null;

interface Props {
  /** Add a task into today's plan. */
  onAddTask: (task: DailyTask) => void;
  /** Tasks already in today's plan (by text) — filtered out of the pick lists. */
  existingTexts: string[];
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = typeof reader.result === "string" ? reader.result : "";
      resolve(r.includes(",") ? r.split(",")[1] : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * The three entry points at the top of Plan Your Day, powered by the weekly
 * plan + planner context:
 *   • Unfinished business  → last week's unfinished plan deliverables
 *   • What are you building → this week's plan deliverables
 *   • Add context          → upload a reference / file for the day
 */
export function DailyPlannerButtons({ onAddTask, existingTexts }: Props) {
  const [open, setOpen] = useState<Panel>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const { data: context } = useApi({
    queryKey: ["planner-context-daily"],
    queryFn: () => WeeklyPlanService.getPlannerContext(),
  });
  const { data: weeklyPlan } = useApi({
    queryKey: ["weekly-plan-current"],
    queryFn: () => WeeklyPlanService.getWeeklyPlan(),
  });

  const added = new Set(existingTexts);

  const unfinished = (context?.carryForwardCandidates ?? []).filter(
    (c) => !added.has(c.title),
  );
  const building = (weeklyPlan?.deliverables ?? [])
    .map((d) => ({
      id: String(d.id ?? ""),
      title: String(d.label ?? d.title ?? ""),
      day: d.day ?? null,
      estimateMins: d.estimateMins ?? undefined,
      programId: d.programId ?? undefined,
    }))
    .filter((d) => d.title && !added.has(d.title));

  const add = (
    text: string,
    estimateMins?: number,
    programId?: string,
    sourceId?: string,
  ) => {
    onAddTask({
      text,
      status: "notStarted",
      type: "planned",
      source: "weekly_basket",
      sourceId,
      budgetMins: estimateMins,
      estimateMins,
      isCriticalPath: false,
      programId,
    });
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await readBase64(file);
      if (!base64) return;
      const res = await WeeklyPlanService.uploadNote({
        fileName: file.name,
        fileData: base64,
        processWithAI: true,
      });
      if (isError(res)) {
        toast.error(res.error.message || "Couldn't upload that file.");
        return;
      }
      setUploaded((prev) => [...prev, file.name]);
      toast.success("Context added");
    } finally {
      setUploading(false);
    }
  };

  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <TabButton
          active={open === "unfinished"}
          icon={<History size={16} />}
          label="Unfinished business"
          count={unfinished.length}
          onClick={() => toggle("unfinished")}
        />
        <TabButton
          active={open === "building"}
          icon={<Target size={16} />}
          label="What are you building"
          count={building.length}
          onClick={() => toggle("building")}
        />
        <TabButton
          active={open === "context"}
          icon={<Paperclip size={16} />}
          label="Add context"
          count={uploaded.length || undefined}
          onClick={() => toggle("context")}
        />
      </div>

      {open === "unfinished" && (
        <PickPanel
          items={unfinished.map((c) => ({
            key: c.id,
            title: c.title,
            sub: [c.programName, c.estimateMins != null ? `~${c.estimateMins}m` : null]
              .filter(Boolean)
              .join(" · "),
            onAdd: () => add(c.title, c.estimateMins, c.programId, c.id),
          }))}
          empty="Nothing carried over from last week's plan."
        />
      )}

      {open === "building" && (
        <PickPanel
          items={building.map((d) => ({
            key: d.id || d.title,
            title: d.title,
            badge: d.day ? DAY_LABEL[d.day] : undefined,
            sub: d.estimateMins != null ? `~${d.estimateMins}m` : undefined,
            onAdd: () => add(d.title, d.estimateMins, d.programId, d.id),
          }))}
          empty="No weekly-plan deliverables yet — generate a plan on Weekly Plan first."
        />
      )}

      {open === "context" && (
        <div className="rounded-lg border border-base-300 bg-base-100 p-4">
          <label
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-6",
              "border-2 border-dashed border-base-300 rounded-lg cursor-pointer",
              "hover:border-primary transition-colors",
            )}
          >
            <Upload size={20} className="text-neutral" />
            <span className="text-sm text-neutral">
              {uploading ? "Uploading…" : "Click to upload a reference or file"}
            </span>
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
          {uploaded.length > 0 && (
            <ul className="mt-3 space-y-1">
              {uploaded.map((n, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-neutral">
                  <Check size={14} className="text-success" />
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors",
        active
          ? "border-primary bg-[var(--dt-tealDim)] text-primary"
          : "border-base-300 bg-base-100 text-neutral hover:border-primary",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {count != null && count > 0 && (
        <Badge variant={active ? "primary" : "ghost"} size="sm">
          {count}
        </Badge>
      )}
    </button>
  );
}

interface PickItem {
  key: string;
  title: string;
  sub?: string;
  badge?: string;
  onAdd: () => void;
}

function PickPanel({ items, empty }: { items: PickItem[]; empty: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-100 p-4 text-sm text-neutral text-center">
        {empty}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 divide-y divide-base-300">
      {items.map((it) => (
        <div key={it.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {it.badge && <Badge variant="primary" size="sm">{it.badge}</Badge>}
              <p className="text-sm text-black truncate">{it.title}</p>
            </div>
            {it.sub && <p className="text-xs text-neutral truncate">{it.sub}</p>}
          </div>
          <Button
            size="sm"
            variant="soft"
            color="primary"
            onClick={it.onAdd}
            iconBefore={<Plus size={14} />}
          >
            Add
          </Button>
        </div>
      ))}
    </div>
  );
}
