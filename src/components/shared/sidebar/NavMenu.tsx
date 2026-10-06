"use client";

import Link from "next/link";
import { ArrowDownIcon } from "@/components/shared/icons";
import { sidebarStyles, gaps } from "@/utils/shared/design.utils";
import { cn } from "@/utils";

interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ElementType;
  children?: NavItem[];
  [key: string]: unknown;
}

interface NavMenuProps {
  items: NavItem[];
  pathname: string;
  openSubmenus: string[];
  onToggleSubmenu: (id: string) => void;
  onNavigate: () => void;
  isParentActive: (item: NavItem) => boolean;
}

export function NavMenu({
  items,
  pathname,
  openSubmenus,
  onToggleSubmenu,
  onNavigate,
  isParentActive,
}: NavMenuProps) {
  return (
    <nav className={sidebarStyles.navigation}>
      <ul className={cn("menu menu-sm w-full", gaps.xs)}>
        {items.map((item) => (
          <li key={item.id}>
            {item.children && item.children.length > 0 ? (
              <>
                <button
                  onClick={() => onToggleSubmenu(item.id)}
                  className={cn(
                    sidebarStyles.menuItem,
                    isParentActive(item)
                      ? sidebarStyles.menuItemActive
                      : sidebarStyles.menuItemInactive
                  )}
                >
                  {item.icon && (
                    <item.icon size={22} className="opacity-70" />
                  )}
                  <span className="text-sm flex-1 text-left">{item.label}</span>
                  <ArrowDownIcon
                    size="sm"
                    className={`transition-transform ${
                      openSubmenus.includes(item.id) ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openSubmenus.includes(item.id) && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={child.path || "#"}
                          className={cn(
                            sidebarStyles.submenuItem,
                            pathname === child.path
                              ? sidebarStyles.submenuItemActive
                              : sidebarStyles.submenuItemInactive
                          )}
                          onClick={onNavigate}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                          <span>{child.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link
                href={item.path || "#"}
                className={cn(
                  sidebarStyles.menuItem,
                  pathname === item.path
                    ? sidebarStyles.menuItemActive
                    : sidebarStyles.menuItemInactive
                )}
                onClick={onNavigate}
              >
                {item.icon && (
                  <item.icon size={22} className="opacity-70" />
                )}
                <span className="text-sm">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
