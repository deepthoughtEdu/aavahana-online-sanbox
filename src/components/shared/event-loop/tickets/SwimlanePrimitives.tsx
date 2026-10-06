import { cn } from "@/utils";

/* ── Swimlane header ────────────────────────────────────────────────────── */
export function SwimHead({
  label, count, subtitle, urgent,
}: { label: string; count?: number; subtitle?: string; urgent?: boolean }) {
  return (
    <div
      className={cn("px-3.5 py-2.5", urgent ? "bg-[var(--dt-navyMid)]" : "bg-[var(--dt-navy)]")}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[10px] font-bold tracking-[0.15em] uppercase",
            urgent ? "text-white" : "text-[var(--el-muted)]",
          )}
        >
          {label}
        </span>
        {count !== undefined && count > 0 && (
          <span className={cn("text-[10px] font-bold", urgent ? "text-warning" : "text-primary/70")}>
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="text-[10px] text-[var(--el-label)] mt-0.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ── Empty swimlane ─────────────────────────────────────────────────────── */
export function SwimEmpty({ label }: { label: string }) {
  return (
    <div className="px-3.5 py-6 text-center text-base-content/40 text-xs italic">
      {label}
    </div>
  );
}

/* ── Downstream risk tags ───────────────────────────────────────────────── */
export function DownstreamRisk({ tasks }: { tasks: string[] }) {
  if (!tasks.length) return null;
  return (
    <div className="mt-2">
      <span className="text-[10px] text-neutral">
        Downstream risk ·{" "}
      </span>
      {tasks.map((t) => (
        <span
          key={t}
          className="text-[10px] font-semibold text-warning bg-warning/10 border border-warning/30 px-1 py-0.5 rounded mr-1"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
