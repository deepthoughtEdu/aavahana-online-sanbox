// Shared stat primitives used by HVT viewer components across modules

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

/** Standalone summary card — full border/background, centred. Used in grid totals rows. */
export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="px-4 py-3.5 rounded-xl bg-base-100 border border-base-300 text-center">
      <div className="text-xl font-extrabold text-base-content" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[11px] font-semibold dt-text-dim mt-0.5">{label}</div>
    </div>
  );
}

/** Inline mini-stat — no card chrome, used inside program cards. */
export function StatMini({ label, value, color }: StatCardProps) {
  return (
    <div>
      <div className="text-base font-extrabold text-base-content" style={color ? { color } : undefined}>{value}</div>
      <div className="text-[10px] dt-text-dim">{label}</div>
    </div>
  );
}
