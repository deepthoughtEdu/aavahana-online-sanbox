// src/components/icons/Action.tsx
import { IconProps, getIconClasses } from "@/utils/shared/design.utils";
import { GripVertical, Mic, Send, StopCircle } from "lucide-react";

/**
 * Action & Interaction Icons
 */

export function PlusIcon({
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
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  );
}

export function EditIcon({
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
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

export function TrashIcon({
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export function CheckIcon({
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function CloseIcon({
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function RefreshIcon({
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
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export function SearchIcon({
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function SaveIcon({
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
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
  );
}

export function CopyIcon({
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
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

export function UndoIcon({
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
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}

export function MicIcon({
  size = "md",
  color = "current",
  className,
}: IconProps) {
  return <Mic className={getIconClasses(size, color, className)} />;
}

export function SendIcon({
  size = "md",
  color = "current",
  className,
}: IconProps) {
  return <Send className={getIconClasses(size, color, className)} />;
}

export function StopIcon({
  size = "md",
  color = "current",
  className,
}: IconProps) {
  return <StopCircle className={getIconClasses(size, color, className)} />;
}

export function GripVerticalIcon({
  size = "md",
  color = "current",
  className,
}: IconProps) {
  return <GripVertical className={getIconClasses(size, color, className)} />;
}