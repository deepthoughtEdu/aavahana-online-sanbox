/**
 * Centralized Design Tokens
 * Single source of truth for sizes, spacing, colors, and reusable styles
 */


// ============================================================================
// SIZES
// ============================================================================

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Position = 'left' | 'right' | 'top' | 'bottom';
export const sizes = {
  xs: {
    padding: 'p-1',
    text: 'text-xs',
    gap: 'gap-1',
    rounded: 'rounded',
  },
  sm: {
    padding: 'p-1.5',
    text: 'text-sm',
    gap: 'gap-1.5',
    rounded: 'rounded-md',
  },
  md: {
    padding: 'p-2',
    text: 'text-base',
    gap: 'gap-2',
    rounded: 'rounded-lg',
  },
  lg: {
    padding: 'p-3',
    text: 'text-lg',
    gap: 'gap-3',
    rounded: 'rounded-lg',
  },
  xl: {
    padding: 'p-4',
    text: 'text-xl',
    gap: 'gap-4',
    rounded: 'rounded-xl',
  },
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
  xl: 'w-9 h-9',
  '2xl': 'w-10 h-10',
} as const;

// ============================================================================
// COLORS
// ============================================================================

export type ColorVariant =
  | 'primary' | 'secondary' | 'accent' | 'success' | 'error'
  | 'warning' | 'info' | 'neutral' | 'ghost' | 'current';

export const textColors: Record<ColorVariant, string> = {
  primary: 'text-primary',
  secondary: 'text-neutral',
  accent: 'text-accent',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  neutral: 'text-neutral',
  ghost: 'text-neutral',
  current: '',
};

export const bgColors: Record<ColorVariant, string> = {
  primary: 'bg-[var(--dt-tealDim)]',
  secondary: 'bg-base-200',
  accent: 'bg-accent/10',
  success: 'bg-[var(--dt-greenDim)]',
  error: 'bg-[var(--dt-redDim)]',
  warning: 'bg-[var(--dt-amberDim)]',
  info: 'bg-[var(--dt-tealDim)]',
  neutral: 'bg-base-200',
  ghost: 'bg-base-200',
  current: '',
};

export const borderColors: Record<ColorVariant, string> = {
  primary: 'border-[var(--dt-tealBorder)]',
  secondary: 'border-base-300',
  accent: 'border-accent/40',
  success: 'border-[var(--dt-greenBorder)]',
  error: 'border-[var(--dt-redBorder)]',
  warning: 'border-[var(--dt-amberBorder)]',
  info: 'border-[var(--dt-tealBorder)]',
  neutral: 'border-base-300',
  ghost: 'border-base-300',
  current: '',
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  none: '',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
} as const;

export const gaps = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '2xl': 'gap-8',
} as const;

// ============================================================================
// GRID LAYOUTS
// ============================================================================

export const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
} as const;

export const mdGridCols = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  7: 'md:grid-cols-7',
  8: 'md:grid-cols-8',
  9: 'md:grid-cols-9',
  10: 'md:grid-cols-10',
  11: 'md:grid-cols-11',
  12: 'md:grid-cols-12',
} as const;

export const lgGridCols = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  7: 'lg:grid-cols-7',
  8: 'lg:grid-cols-8',
  9: 'lg:grid-cols-9',
  10: 'lg:grid-cols-10',
  11: 'lg:grid-cols-11',
  12: 'lg:grid-cols-12',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export type Shape = 'square' | 'default' | 'rounded';

export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  rounded: 'rounded-full',
  square: "none",
  default: 'rounded-md'
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  none: 'transition-none',
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC PRESETS
// ============================================================================


export const iconBoxSizes = {
  sm: { padding: 'p-1.5', text: 'text-sm', iconSize: 'sm' as IconSize },
  md: { padding: 'p-2', text: 'text-base', iconSize: 'md' as IconSize },
  lg: { padding: 'p-3', text: 'text-lg', iconSize: 'lg' as IconSize },
  xl: { padding: 'p-5', text: 'text-xl', iconSize: 'xl' as IconSize },

} as const;

export const sectionHeaderSizes = {
  sm: { container: 'p-3', title: 'text-sm font-semibold', subtitle: 'text-xs' },
  md: { container: 'p-4', title: 'text-lg font-semibold', subtitle: 'text-sm' },
  lg: { container: 'p-5', title: 'text-xl font-bold', subtitle: 'text-base' },
} as const;

export const emptyStateSizes = {
  sm: { container: 'p-6', gap: 'gap-2', icon: 'text-2xl', iconPadding: 'p-2', title: 'text-sm font-semibold', subtitle: 'text-xs dt-text-muted', actions: 'mt-3' },
  md: { container: 'p-8', gap: 'gap-3', icon: 'text-3xl', iconPadding: 'p-3', title: 'text-lg font-semibold', subtitle: 'text-sm dt-text-muted', actions: 'mt-4' },
  lg: { container: 'p-10', gap: 'gap-4', icon: 'text-4xl', iconPadding: 'p-4', title: 'text-xl font-bold', subtitle: 'text-base dt-text-muted', actions: 'mt-5' },
} as const;

export const pageHeaderStyles = {
  container: 'flex items-center justify-between pb-6 border-b border-base-300',
  wrapper: 'mb-6',
  content: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
  titleSection: 'flex-1 min-w-0',
  label: 'text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary mb-1',
  title: 'text-xl font-extrabold font-[family-name:var(--font-display)] text-black tracking-tight',
  subtitle: 'dt-text-muted text-xs max-w-2xl',
  subtitleWithMargin: 'mt-1 text-xs dt-text-muted',
  actions: 'flex items-center gap-2 ml-4',
  actionsResponsive: 'flex items-center gap-2 sm:gap-3 flex-shrink-0',
} as const;

export const overlayLoadingSizes = {
  xs: { spinner: 'loading-xs', text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1.5' },
  sm: { spinner: 'loading-sm', text: 'text-xs', padding: 'px-3 py-1.5', gap: 'gap-2' },
  md: { spinner: 'loading-md', text: 'text-sm', padding: 'px-4 py-2', gap: 'gap-2' },
} as const;

export const tabSizes = {
  sm: { container: 'px-3 py-2', minWidth: 'min-w-[180px]', gap: 'gap-2', title: 'text-[14px] font-medium', description: 'text-[11px]', iconSize: 'sm' as IconSize },
  md: { container: 'px-4 py-3', minWidth: 'min-w-[220px]', gap: 'gap-3', title: 'text-base font-medium', description: 'text-[13px]', iconSize: 'md' as IconSize },
  lg: { container: 'px-5 py-4', minWidth: 'min-w-[260px]', gap: 'gap-4', title: 'text-lg font-medium', description: 'text-sm', iconSize: 'lg' as IconSize },
} as const;

export const tabPillStyles = {
  container: 'w-full border-b border-base-300 -mx-4 md:-mx-6 px-4 md:px-6',
  scrollContainer: 'flex gap-2 overflow-x-auto scrollbar-hide pb-px',
  pill: 'flex items-center gap-2 px-4 py-2.5 whitespace-nowrap rounded-t-lg border-b-2 transition-all text-sm font-medium flex-shrink-0',
  pillInactive: 'border-b-transparent text-neutral hover:text-black hover:border-b-base-300',
} as const;

export const paginationStyles = {
  container: 'flex flex-wrap items-center justify-between gap-4 py-3 px-4 border-t border-base-300 bg-white/50 rounded-b-lg',
  resultsText: 'text-sm text-neutral font-medium',
  resultsHighlight: 'text-black font-semibold',
  buttonGroup: 'join border border-base-300 rounded-lg bg-white',
  selectContainer: 'flex items-center gap-2',
  selectLabel: 'text-sm text-neutral',
  select: 'select select-sm border-base-300 bg-white',
} as const;

export const modalStyles = {
  container: 'modal-box max-w-7xl max-h-[92vh] overflow-hidden flex flex-col p-0 shadow-[0_4px_18px_rgba(0,0,0,0.14)]',
  body: 'flex-1 overflow-y-auto p-6',
  footer: 'sticky bottom-0 z-20 bg-white border-t border-base-300 px-6 py-3',
  backdrop: 'modal-backdrop',
} as const;

export const sidebarStyles = {
  header: 'h-14 flex items-center justify-between px-5 border-b border-[var(--dt-border)]',
  headerLogo: 'flex items-center gap-3 group',
  moduleName: 'text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary',
  orgSwitcher: 'p-3 border-b border-[var(--dt-border)]',
  orgButton: 'btn btn-sm btn-ghost w-full justify-between hover:bg-[var(--dt-bgDeep)] px-3 list-none',
  orgButtonContent: 'flex items-center gap-2 min-w-0 flex-1',
  navigation: 'flex-1 overflow-y-auto p-3',
  menuItem: 'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
  menuItemActive: 'bg-[var(--dt-tealDim)] text-primary font-medium border-l-2 border-primary',
  menuItemInactive: 'text-[var(--dt-textMuted)] hover:text-black hover:bg-[var(--dt-bgDeep)]',
  submenuItem: 'flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
  submenuItemActive: 'bg-[var(--dt-tealDim)] text-primary font-medium',
  submenuItemInactive: 'text-[var(--dt-textDim)] hover:text-black hover:bg-[var(--dt-bgDeep)]',
  footer: 'p-3 border-t border-[var(--dt-border)] bg-[var(--dt-bgDeep)]/30',
  footerProfile: 'flex items-center gap-3 p-3 bg-[var(--dt-bg)] rounded-lg mb-2 border border-[var(--dt-border)]/50',
} as const;

// Command palette. Geometry (width, top offset, list height, z-index) lives in
// `.dt-cmdk*` in src/styles/components.css — only class strings here.
export const commandPaletteStyles = {
  overlay: 'modal modal-open dt-cmdk',
  box: 'modal-box dt-cmdk-box',
  inputRow: 'p-3 border-b border-[var(--dt-border)]',
  // The field draws its own border so the bare <input> can opt out of the global
  // `input:focus` rule in forms.css (which is !important and would double it up).
  inputField: 'flex items-center gap-2.5 h-11 px-3 rounded-xl border border-[var(--dt-border)] bg-[var(--dt-bgDeep)]/50 transition-colors duration-150 focus-within:border-primary focus-within:bg-white',
  input: 'dt-cmdk-input flex-1 min-w-0 h-full text-sm text-black placeholder:text-[var(--dt-textDim)]',
  list: 'dt-cmdk-list px-2 pb-2',
  groupLabel: 'px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--dt-textDim)]',
  option: 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-100',
  optionSelected: 'bg-[var(--dt-tealDim)] text-primary',
  optionIdle: 'text-[var(--dt-textMuted)]',
  optionIconSlot: 'shrink-0 w-[18px] flex items-center justify-center',
  optionLabel: 'flex-1 min-w-0 truncate text-sm',
  optionMeta: 'shrink-0 text-xs text-[var(--dt-textDim)] truncate',
  empty: 'px-4 py-10 text-center text-sm text-[var(--dt-textDim)]',
  footer: 'flex items-center justify-between gap-3 px-4 py-2 border-t border-[var(--dt-border)] bg-[var(--dt-bgDeep)]/40 text-[11px] text-[var(--dt-textDim)]',
  trigger: 'hidden sm:flex items-center gap-2 h-8 pl-3 pr-2 rounded-lg border border-[var(--dt-border)] text-[var(--dt-textDim)] hover:text-black hover:bg-[var(--dt-bgDeep)] transition-colors duration-150',
  triggerMobile: 'btn btn-ghost btn-circle btn-sm sm:hidden text-[var(--dt-textDim)] hover:text-black',
} as const;

export const containerPadding = {
  none: 'p-0',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
  '2xl': 'p-8',
} as const;

export const horizontalPadding = {
  none: 'px-0',
  xs: 'px-2',
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-5',
  xl: 'px-6',
  '2xl': 'px-8',
} as const;

export const verticalPadding = {
  none: 'py-0',
  xs: 'py-1',
  sm: 'py-1.5',
  md: 'py-2',
  lg: 'py-2.5',
  xl: 'py-3',
  '2xl': 'py-4',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// ============================================================================
// FEEDBACK SCORE COLORS — uses canonical traffic lights, NOT separate hues
// See design-principles.md: "Status Traffic Lights" section
// ============================================================================

export function getScoreColor(score: number | null) {
  if (score === null) return { text: 'text-[var(--dt-textDim)]', bg: '', bar: '' };
  if (score >= 8) return { text: 'text-success', bg: 'bg-[var(--dt-greenDim)]', bar: 'bg-success' };
  if (score >= 6) return { text: 'text-warning', bg: 'bg-[var(--dt-amberDim)]', bar: 'bg-warning' };
  return { text: 'text-error', bg: 'bg-[var(--dt-redDim)]', bar: 'bg-error' };
}

export function getIconClasses(size: IconSize = 'md', color?: ColorVariant, className?: string): string {
  return [iconSizes[size], color ? textColors[color] : '', className].filter(Boolean).join(' ');
}

export function getColoredBox(variant: ColorVariant, isActive = false) {
  return {
    bg: isActive ? bgColors[variant] : 'bg-base-200',
    text: isActive ? textColors[variant] : 'text-[var(--dt-textDim)]',
    border: isActive ? borderColors[variant] : 'border-base-300',
  };
}

export function getDynamicColorClasses(color: string = 'primary', isActive: boolean = false) {
  const colorMap: Record<string, ColorVariant> = {
    primary: 'primary',
    secondary: 'secondary',
    accent: 'accent',
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  const variant = colorMap[color] || 'primary';

  return {
    border: isActive ? borderColors[variant] : borderColors.ghost,
    bg: isActive ? bgColors[variant] : bgColors.ghost,
    text: isActive ? textColors[variant] : textColors.ghost,
    hoverBorder: borderColors[variant],
    hoverBg: bgColors[variant],
  };
}

export interface IconProps {
  size?: IconSize;
  color?: ColorVariant;
  className?: string;
  strokeWidth?: number;
}

export function getEmptyStateColors(variant: 'empty' | 'error' | 'info') {
  const colorMap = {
    empty: { text: textColors.primary, bg: bgColors.primary },
    error: { text: textColors.error, bg: bgColors.error },
    info: { text: textColors.info, bg: bgColors.info },
  };
  return colorMap[variant];
}

export interface RingProps {
  color?: ColorVariant;
  size?: number;
  gap?: number;
  offset?: number;
}

// Button and Badge lookup tables removed — Button uses btn-${color} template literals,
// Badge uses data-color attribute with dt.css receivers. See PDGMSDocs/ToDo/dt-css-first-architecture-plan.md

// ============================================================================
// PRACTICE DOMAIN COLORS (5×5 grid horizontals)
// ============================================================================

export type PracticeDomain = 'decide' | 'develop' | 'deliver' | 'delight' | 'amplify';

export const domainColors: Record<PracticeDomain, {
  text: string;
  bg: string;
  bgSolid: string;
  border: string;
  tag: string;
}> = {
  decide:  { text: 'text-[var(--domain-decide)]',  bg: 'bg-[var(--domain-decide-dim)]',  bgSolid: 'bg-[var(--domain-decide)]',  border: 'border-[var(--domain-decide-border)]',  tag: 'H5' },
  develop: { text: 'text-[var(--domain-develop)]', bg: 'bg-[var(--domain-develop-dim)]', bgSolid: 'bg-[var(--domain-develop)]', border: 'border-[var(--domain-develop-border)]', tag: 'H4' },
  deliver: { text: 'text-[var(--domain-deliver)]', bg: 'bg-[var(--domain-deliver-dim)]', bgSolid: 'bg-[var(--domain-deliver)]', border: 'border-[var(--domain-deliver-border)]', tag: 'H3' },
  delight: { text: 'text-[var(--domain-delight)]', bg: 'bg-[var(--domain-delight-dim)]', bgSolid: 'bg-[var(--domain-delight)]', border: 'border-[var(--domain-delight-border)]', tag: 'H2' },
  amplify: { text: 'text-[var(--domain-amplify)]', bg: 'bg-[var(--domain-amplify-dim)]', bgSolid: 'bg-[var(--domain-amplify)]', border: 'border-[var(--domain-amplify-border)]', tag: 'H1' },
} as const;

export type VerticalLevel = 'V5' | 'V4' | 'V3' | 'V2' | 'V1';

export const verticalLevelColors: Record<VerticalLevel, {
  text: string;
  bg: string;
  bgSolid: string;
  border: string;
  label: string;
}> = {
  V5: { text: 'text-[var(--vertical-v5)]', bg: 'bg-[var(--vertical-v5-dim)]', bgSolid: 'bg-[var(--vertical-v5)]', border: 'border-[var(--vertical-v5-border)]', label: 'Direction' },
  V4: { text: 'text-[var(--vertical-v4)]', bg: 'bg-[var(--vertical-v4-dim)]', bgSolid: 'bg-[var(--vertical-v4)]', border: 'border-[var(--vertical-v4-border)]', label: 'Strategy' },
  V3: { text: 'text-[var(--vertical-v3)]', bg: 'bg-[var(--vertical-v3-dim)]', bgSolid: 'bg-[var(--vertical-v3)]', border: 'border-[var(--vertical-v3-border)]', label: 'Tactics' },
  V2: { text: 'text-[var(--vertical-v2)]', bg: 'bg-[var(--vertical-v2-dim)]', bgSolid: 'bg-[var(--vertical-v2)]', border: 'border-[var(--vertical-v2-border)]', label: 'Operations' },
  V1: { text: 'text-[var(--vertical-v1)]', bg: 'bg-[var(--vertical-v1-dim)]', bgSolid: 'bg-[var(--vertical-v1)]', border: 'border-[var(--vertical-v1-border)]', label: 'Execution' },
} as const;

export const practiceTypeColors: Record<'framework' | 'process' | 'ritual', {
  label: string;
  sublabel: string;
  variant: ColorVariant;
}> = {
  framework: { label: 'Framework', sublabel: 'How I Think',    variant: 'primary' },
  process:   { label: 'Process',   sublabel: 'How I Do',       variant: 'success' },
  ritual:    { label: 'Ritual',    sublabel: 'How I Sustain',  variant: 'warning' },
} as const;

// ============================================================================
// OSD CARD & SECTION PRESETS
// ============================================================================

export const cardStyles = {
  base: 'bg-white border border-base-300 rounded-[9px]',
  padded: 'p-[14px_16px]',
  paddedLg: 'p-[18px]',
} as const;

export const sectionIdStyles = {
  container: 'bg-black rounded-t-lg px-4 py-2.5 flex items-center justify-between',
  label: 'text-[9px] font-extrabold uppercase tracking-[0.14em] text-[var(--dt-tealLight)]',
  title: 'text-sm font-extrabold font-[family-name:var(--font-display)] text-white',
  sub: 'text-[11px] text-[var(--dt-textMuted-dark)]',
  badges: 'flex gap-2 items-center',
} as const;