"use client";

import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/shared/icons";
import { AvatarImage } from "../AvatarImage";
import { sidebarStyles } from "@/utils/shared/design.utils";
import { routes } from "@/config/routes";

interface UserFooterProps {
  username: string;
  email: string;
  picture?: string;
  role: string;
  onLogout: () => void;
}

export function UserFooter({
  username,
  email,
  picture,
  role,
  onLogout,
}: UserFooterProps) {
  const router = useRouter();
  return (
    <div className={sidebarStyles.footer}>
      <div
        onClick={() => router.push(routes.profile())}
        className={sidebarStyles.footerProfile}
      >
        <div className="avatar">
          <div className="w-10 rounded-full ring-2 ring-[var(--dt-border)] ring-offset-2 ring-offset-[var(--dt-bg)]">
            <AvatarImage src={picture} alt={username} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-black">{username}</p>
          <p className="text-xs text-[var(--dt-textDim)] truncate">{email}</p>
          <span className="badge badge-xs bg-[var(--dt-bgDeep)] text-[var(--dt-textMuted)] border-0 mt-1 capitalize">
            {role}
          </span>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="btn btn-ghost btn-sm w-full gap-2 text-[var(--dt-textMuted)] hover:text-black hover:bg-[var(--dt-bgDeep)]"
      >
        <LogoutIcon />
        Logout
      </button>
    </div>
  );
}
