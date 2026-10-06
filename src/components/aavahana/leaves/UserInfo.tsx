"use client";

import { AvatarImage } from "@/components/shared/AvatarImage";

interface UserInfoProps {
  uid: string | null;
  title?: string;
  name?: string | null;
  picture?: string | null;
}

/**
 * Renders a small user identity card. Only renders when we actually have a
 * resolved name — never falls back to a "User <uid>" placeholder.
 */
export function UserInfo({ uid, title = "User", name, picture }: UserInfoProps) {
  if (!uid || !name) return null;

  return (
    <div className="flex items-center gap-3">
      <AvatarImage src={picture ?? null} name={name} size={40} />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs text-base-content/60 truncate">{title}</h4>
        <p className="font-semibold text-sm truncate">{name}</p>
      </div>
    </div>
  );
}
