import React from "react";

export function NavyHead({ label, badge, badgeColor }: {
  label:       string;
  badge?:      string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-[var(--dt-navy)] px-4 py-[9px] rounded-t-md">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--el-muted)]">
        {label}
      </span>
      {badge && (
        <span
          className="text-[10px] font-bold"
          style={badgeColor ? { color: badgeColor } : undefined}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
