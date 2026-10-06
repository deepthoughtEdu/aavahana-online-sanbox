import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function getFunctionSignature(fn: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalFn = (fn as any).__originalFunc || fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boundArgs = (fn as any).__boundArgs || [];

  const code = originalFn.toString();

  // Include the function name and serialized bound args
  const identifier = JSON.stringify({
    name: originalFn.name || "anonymous",
    args: boundArgs,
  });

  const hash = crypto
    .createHash("sha256")
    .update(code + identifier)
    .digest("hex");

  return hash;
}

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 *
 * @example
 * cn('px-2 py-1', condition && 'bg-blue-500', { 'text-white': isActive })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get color class based on password strength
 */
export const getStrengthColor = (strength: string): string => {
  switch (strength) {
    case "weak":
      return "bg-error";
    case "medium":
      return "bg-warning";
    case "strong":
      return "bg-info";
    case "very-strong":
      return "bg-success";
    default:
      return "bg-base-300";
  }
};

/**
 * Get width class based on password strength
 */
export const getStrengthWidth = (strength: string): string => {
  switch (strength) {
    case "weak":
      return "w-1/4";
    case "medium":
      return "w-2/4";
    case "strong":
      return "w-3/4";
    case "very-strong":
      return "w-full";
    default:
      return "w-0";
  }
};

/**
 * Generate a consistent avatar URL based on user ID or username
 * Uses DiceBear API with consistent seed
 * 
 * @param userId - User ID or username to use as seed
 * @param size - Avatar size in pixels (default: 144)
 * @returns Consistent avatar URL
 * 
 * @example
 * const avatarUrl = getConsistentAvatarUrl(user.uid);
 * const smallAvatar = getConsistentAvatarUrl(user.username, 40);
 */
export function getConsistentAvatarUrl(
  userId: string | number, 
  size: number = 144
): string {
  const seed = String(userId);
  return `https://api.dicebear.com/9.x/adventurer/png?size=${size}&seed=${seed}`;
}
