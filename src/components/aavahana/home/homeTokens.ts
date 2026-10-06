// Aavahana home-page design tokens — BRAND SURFACE (L1: Daily Ops)
// Dark homepage — pure black canvas, orange accent sparingly.
// All values reference CSS vars from src/styles/theme.css.
// textMuted=#777777 (--dt-textMuted-dark) is intentionally lighter than light-surface textMuted (#555555) —
// #555555 fails contrast on black (3.5:1 ratio). See design-principles.md.
export const C = {
  navy:         "var(--dt-navy)",
  navyMid:      "var(--dt-navyMid)",
  navyLight:    "var(--dt-navyLight)",
  navyDeep:     "var(--dt-navy)",
  accent:       "var(--module-aavahana)",       // L1 identity: orange-600 #EA580C
  accentLight:  "var(--module-aavahana-light)",
  accentGlow:   "var(--module-aavahana-glow)",
  accentDim:    "var(--module-aavahana-dim)",
  accentBorder: "var(--module-aavahana-border)",
  textDim:      "var(--dt-textDim)",
  textMuted:    "var(--dt-textMuted-dark)",     // dark canvas variant — #777777
  fontBase:     "'DM Sans','Helvetica Neue',sans-serif",
  fontDisplay:  "'Playfair Display',serif",
} as const;
