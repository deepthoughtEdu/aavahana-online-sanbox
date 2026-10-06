// src/components/icons/Navigation.tsx
import { IconProps, getIconClasses } from "@/utils/shared/design.utils";

/**
 * Navigation & Direction Icons
 */

export function HomeIcon({
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
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

export function ArrowLeftIcon({
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
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

export function ArrowRightIcon({
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
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}

export function ArrowUpIcon({
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
        d="M5 15l7-7 7 7"
      />
    </svg>
  );
}

export function ArrowDownIcon({
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
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function ChevronLeftIcon({
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
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

export function ChevronRightIcon({
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export function GlobeIcon({
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
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

export function LocationIcon({
  size = "md",
  color = "current",
  className,
  strokeWidth = 1.25,
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
        d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
      />
      <circle
        cx="12"
        cy="10"
        r="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}