// src/components/icons/Lab.tsx
import { IconProps, getIconClasses } from "@/utils/shared/design.utils";

/**
 * Lab & Science Icons
 * Icons for experimental features, research, and scientific contexts
 */

export function FlaskIcon({
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
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}

export function AtomIcon({
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
      <circle
        cx="12"
        cy="12"
        r="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        fill="currentColor"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M12 12c-4.97 0-9-1.79-9-4s4.03-4 9-4 9 1.79 9 4-4.03 4-9 4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M6.34 14.67c-2.49-4.3-2.49-8.77 0-10 2.49-1.23 6.65.69 9.32 4.29"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M17.66 14.67c2.49-4.3 2.49-8.77 0-10-2.49-1.23-6.65.69-9.32 4.29"
      />
    </svg>
  );
}

export function MicroscopeIcon({
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
        d="M9 3v2m6-2v2M9 19c-4.3 1.4-4.3 5 0 6.3m0-6.3c3.5-1 4.5-3 4.5-4.5V6m-4.5 13c1.3.3 2.7.3 4 0m-4 0v-2m4 2v-2m-5-2h6"
      />
      <circle cx="12" cy="12" r="1.5" strokeWidth={strokeWidth} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="M13 13l2-2m-6 2l-2-2"
      />
    </svg>
  );
}

export function BeakerIcon({
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
        d="M9 3v1m6-1v1m-4 8v7m-4-4l7 3 7-3m-7 4v4m-7-4l7-3 7 3M7 4h10a1 1 0 011 1v4a1 1 0 01-.293.707L13 15.414V19a1 1 0 01-1 1H8a1 1 0 01-1-1v-3.586L2.293 9.707A1 1 0 012 9V5a1 1 0 011-1z"
      />
    </svg>
  );
}

export function TestTubeIcon({
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
        d="M14.5 3v12.5m0 0a4.5 4.5 0 11-9 0V3m9 12.5a4.5 4.5 0 00-9 0M6 3h12"
      />
    </svg>
  );
}

export function DnaIcon({
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
        d="M9 3h6M9 21h6M9 3c0 2.4 1.8 4.8 4.5 6M15 21c0-2.4-1.8-4.8-4.5-6m0 0c2.7-1.2 4.5-3.6 4.5-6m-4.5 6c-2.7 1.2-4.5 3.6-4.5 6m9-9h-3m-3 0H6"
      />
    </svg>
  );
}

export function GridLabIcon({
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
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      <circle cx="17" cy="7" r="1.5" fill="currentColor" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}