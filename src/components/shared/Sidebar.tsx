// src/components/shared/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sidebarOpenAtom } from "@/lib/store/auth";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { menuItems } from "@/config/menu";
import type { MenuItem } from "@/types";
import { resolveDynamicPath } from "@/utils";
import { CloseIcon } from "@/components/shared/icons";
import Image from "next/image";
import { sidebarStyles } from "@/utils/shared/design.utils";
import { OrgSwitcher } from "./sidebar/OrgSwitcher";
import { NavMenu } from "./sidebar/NavMenu";
import { UserFooter } from "./sidebar/UserFooter";


export interface SidebarProps {
  moduleName?: string;
  navItems?: MenuItem[];
}

export function Sidebar({ moduleName, navItems }: SidebarProps = {}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const { user, selectedOrg, userRole, hasRole, switchOrg, logout } = useAuth();

  const sourceMenuItems = navItems ?? menuItems;
  const prevPathnameRef = useRef(pathname);

  const pathContext = useMemo(
    () => ({ profile: user, selectedOrg }),
    [user, selectedOrg]
  );

  const visibleMenuItems = useMemo(() => {
    return sourceMenuItems
      .filter((item) => {
        // Kept out of the sidebar, not removed from the app. The route still
        // works, and the command palette does not apply this filter, so Cmd+K
        // still finds them. That is deliberate: `advanced` is a display choice
        // about sidebar noise, not a permission. Do not copy this filter into
        // command-index.ts.
        if (item.advanced) return false;
        if (!item.roles) return true;
        return hasRole(item.roles);
      })
      .map((item) => ({
        ...item,
        path: item.path ? resolveDynamicPath(item.path, pathContext) : item.path,
        children: item.children
          ?.filter((child) => {
            if (!child.roles) return true;
            return hasRole(child.roles);
          })
          .map((child) => ({
            ...child,
            path: child.path ? resolveDynamicPath(child.path, pathContext) : child.path,
          })),
      }));
  }, [sourceMenuItems, hasRole, pathContext]);

  /**
   * Which child the current URL is on.
   *
   * ⚠️ EXACT EQUALITY IS NOT ENOUGH, and longest match is what makes prefixes safe. A module whose
   * first child sits at the module root (BD Voice: Accounts is `/beta/crm/bd-voice`) would match
   * every page under it on a plain `startsWith`, so every group would read as active. Taking the
   * LONGEST matching child instead means `/beta/crm/bd-voice/roster` resolves to Roster and
   * `/beta/crm/bd-voice/leads/4210` falls back to Accounts, which is where the rep came from.
   */
  const activeChildPath = useMemo(() => {
    const paths = sourceMenuItems
      .flatMap((item) => item.children ?? [])
      .map((child) => child.path)
      .filter((path): path is string => !!path)
      .filter((path) => pathname === path || pathname?.startsWith(`${path}/`));
    return paths.sort((a, b) => b.length - a.length)[0] ?? null;
  }, [sourceMenuItems, pathname]);

  const isParentActive = useCallback(
    (item: { children?: { path?: string }[] }) =>
      item.children?.some((child) => child.path === activeChildPath) || false,
    [activeChildPath]
  );

  const toggleSubmenu = useCallback((id: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  /**
   * Open the group the current page is in.
   *
   * ⚠️ THIS USED TO SKIP THE FIRST RENDER. `prevPathnameRef` is seeded with the current pathname,
   * so the `!==` guard was false on mount and nothing opened — the group expanded only if you
   * navigated INTO it from another page in the app. Land on a URL directly, or reload, and every
   * group sat shut, which made each screen two clicks away (Tarun, 2026-09-22). Dropping the guard
   * runs it on mount too; it still only ever ADDS, so a group the reader closed by hand stays
   * closed until the route changes.
   */
  useEffect(() => {
    const newActiveParents = visibleMenuItems
      .filter((item) => item.children?.some((child) => child.path === activeChildPath))
      .filter((item) => !openSubmenus.includes(item.id))
      .map((item) => item.id);

    if (newActiveParents.length > 0) {
      setOpenSubmenus((prev) => [...prev, ...newActiveParents]);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, activeChildPath, visibleMenuItems, openSubmenus]);

  // Close the mobile drawer whenever the route changes. NavMenu's onNavigate covers
  // clicks on nav items, but not an override menu, a logo click, or a programmatic
  // router.push — those would otherwise leave the drawer sitting over the new page.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const handleOrgSwitch = useCallback(
    (orgId: string) => {
      switchOrg(orgId);
      setIsOpen(false);
      setIsOrgDropdownOpen(false);
    },
    [switchOrg, setIsOpen]
  );

  if (!user) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-400 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="dt-sidebar"
        className={`fixed top-0 left-0 z-500 h-screen w-76 bg-[var(--dt-bg)] border-r border-[var(--dt-border)]
        transition-transform duration-300 shadow-xl lg:shadow-none
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className={sidebarStyles.header}>
            <Link
              href="/aavahana/dashboard"
              className={sidebarStyles.headerLogo}
              onClick={() => setIsOpen(false)}
            >
              <Image src="/deepthought-logo.svg" alt="DeepThought Logo" width={300} height={100} />
            </Link>
            <button
              className="btn btn-ghost btn-sm btn-square lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          {moduleName && (
            <div className="px-5 py-2 border-b border-[var(--dt-border)]">
              <span className={sidebarStyles.moduleName}>{moduleName}</span>
            </div>
          )}

          <OrgSwitcher
            organizations={user.organizations}
            selectedOrgId={selectedOrg?.orgId}
            selectedOrgName={selectedOrg?.name}
            isOpen={isOrgDropdownOpen}
            onToggle={setIsOrgDropdownOpen}
            onSwitch={handleOrgSwitch}
          />

          <NavMenu
            items={visibleMenuItems}
            pathname={pathname}
            openSubmenus={openSubmenus}
            onToggleSubmenu={toggleSubmenu}
            onNavigate={() => setIsOpen(false)}
            isParentActive={isParentActive}
          />

          <UserFooter
            username={user.username}
            email={user.email}
            picture={user.picture ?? undefined}
            role={userRole}
            onLogout={logout}
          />
        </div>
      </aside>
    </>
  );
}
