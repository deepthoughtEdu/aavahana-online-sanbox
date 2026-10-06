// src/components/icons/Status.tsx
import { IconProps, getIconClasses } from "@/utils/shared/design.utils";

/**
 * Status & Feedback Icons
 */

export function CheckCircleIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function XCircleIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function InfoIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function AlertCircleIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function WarningIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export function EyeIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

export function EyeOffIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export function LockIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

export function BanIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

export function SpinnerIcon({
  size = "md",
  color = "current",
  className,
}: IconProps) {
  return (
    <span
      className={`loading loading-spinner ${getIconClasses(
        size,
        color,
        className
      )}`}
    />
  );
}

export function BellIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export function BellOffIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      className={getIconClasses(size, color, className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M9.172 14.828L12 12m0 0l2.828-2.828M12 12l2.828 2.828M12 12l-2.828-2.828m5.656 9.172v1a3 3 0 11-6 0v-1m6 0H9m6 0v-1.172M4 17h5l-.595-1.405A2.032 2.032 0 018 14.158V11a6.002 6.002 0 014-5.659V5a2 2 0 114 0v.341C17.33 6.165 19 8.388 19 11v3.159c0 .538.214 1.055.595 1.436L20 17h-5"
      />
    </svg>
  );
}