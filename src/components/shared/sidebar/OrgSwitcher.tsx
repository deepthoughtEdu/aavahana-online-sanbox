"use client";

import {
  ArrowDownIcon,
  BuildingIcon,
  CheckIcon,
} from "@/components/shared/icons";
import { sidebarStyles, containerPadding } from "@/utils/shared/design.utils";
import { cn } from "@/utils";

interface Organization {
  orgId: string;
  name: string;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  selectedOrgId?: string;
  selectedOrgName?: string;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onSwitch: (orgId: string) => void;
}

export function OrgSwitcher({
  organizations,
  selectedOrgId,
  selectedOrgName,
  isOpen,
  onToggle,
  onSwitch,
}: OrgSwitcherProps) {
  return (
    <div className={sidebarStyles.orgSwitcher}>
      <details
        className="dropdown w-full"
        open={isOpen}
        onToggle={(e) => onToggle(e.currentTarget.open)}
      >
        <summary className={sidebarStyles.orgButton}>
          <div className={sidebarStyles.orgButtonContent}>
            <BuildingIcon size="sm" className="text-[var(--dt-textDim)] flex-shrink-0" />
            <span className="truncate text-sm font-medium text-black/80">
              {selectedOrgName}
            </span>
          </div>
          <ArrowDownIcon size="sm" className="flex-shrink-0 text-[var(--dt-textDim)]" />
        </summary>
        <ul
          className={cn(
            "menu dropdown-content bg-[var(--dt-bg)] rounded-box w-full mt-2 shadow-lg border border-[var(--dt-border)] max-h-60 overflow-y-auto z-10",
            containerPadding.xs
          )}
        >
          {organizations.map((org) => (
            <li key={org.orgId}>
              <button
                onClick={() => onSwitch(org.orgId)}
                className={cn("text-sm justify-between", {
                  "bg-[var(--dt-bgDeep)] text-black font-medium":
                    selectedOrgId === org.orgId,
                  "text-[var(--dt-textMuted)] hover:text-black":
                    selectedOrgId !== org.orgId,
                })}
              >
                <span className="flex-1 truncate text-left">{org.name}</span>
                {selectedOrgId === org.orgId && (
                  <CheckIcon
                    size="sm"
                    color="success"
                    className="flex-shrink-0"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
