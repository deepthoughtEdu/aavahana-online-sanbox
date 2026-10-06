export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info'
  | 'current'; // inherits currentColor

export interface IconProps {
  size?: IconSize;
  color?: IconColor;
  className?: string;
  strokeWidth?: number;
}

// Size mappings to Tailwind classes
export const sizeMap: Record<IconSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

// Color mappings to Tailwind classes
export const colorMap: Record<IconColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  current: '', // Uses currentColor by default
};

/**
 * Helper to build icon className from props
 */
export function getIconClasses(
  size: IconSize = 'md',
  color: IconColor = 'current',
  className?: string
): string {
  const classes = [
    sizeMap[size],
    colorMap[color],
    className,
  ].filter(Boolean);
  
  return classes.join(' ');
}

/**
 * Default icon props
 */
export const defaultIconProps: Required<Omit<IconProps, 'className'>> = {
  size: 'md',
  color: 'current',
  strokeWidth: 2,
};