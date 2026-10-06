"use client";

import { useAtom, useAtomValue } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SearchIcon } from "@/components/shared/icons";
import { resolveNavModule } from "@/config/modules";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useNavAccess } from "@/lib/hooks/shared/use-nav-access";
import {
  buildCommandIndex,
  defaultCommands,
  searchCommands,
  type CommandEntry,
} from "@/lib/nav/command-index";
import { tourDayAtom } from "@/lib/store/auth";
import {
  commandPaletteOpenAtom,
  MAX_RECENT_COMMANDS,
  recentCommandsAtom,
} from "@/lib/store/ui";
import { commandPaletteStyles as s } from "@/utils/shared/design.utils";

const RESULT_LIMIT = 30;

/** A rendered section of the results list. */
interface ResultGroup {
  id: string;
  label: string;
  entries: CommandEntry[];
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

/**
 * Global navigation search. Mounted once, inside AuthProvider's authenticated
 * with-chrome branch — which is what keeps it off public routes, off /growth/[dealId],
 * and off the loading and access-denied screens without a single runtime check.
 */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, selectedOrg } = useAuth();
  const access = useNavAccess();
  const tourDay = useAtomValue(tourDayAtom);

  const [open, setOpen] = useAtom(commandPaletteOpenAtom);
  const [recentKeys, setRecentKeys] = useAtom(recentCommandsAtom);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  const pathContext = useMemo(
    () => ({ profile: user, selectedOrg }),
    [user, selectedOrg]
  );

  const index = useMemo(
    () => buildCommandIndex({ access, pathContext, runtime: { tourDay } }),
    [access, pathContext, tourDay]
  );

  const currentModuleId = resolveNavModule(pathname)?.id ?? null;

  // Groups shown before the user types anything. An alphabetical dump of ~200 entries
  // answers nobody's question; "where am I, and where was I" is the real first-open need.
  const groups = useMemo<ResultGroup[]>(() => {
    if (query.trim()) {
      const hits = searchCommands(index, query, RESULT_LIMIT);
      return hits.length ? [{ id: "results", label: "Results", entries: hits }] : [];
    }

    const { recents, currentModule, modules } = defaultCommands(index, {
      recentKeys,
      currentModuleId,
    });

    return [
      { id: "recent", label: "Recent", entries: recents },
      {
        id: "current",
        label: currentModuleId ? `In ${resolveNavModule(pathname)?.label}` : "This module",
        entries: currentModule.slice(0, 6),
      },
      { id: "modules", label: "Go to product", entries: modules },
    ].filter((g) => g.entries.length > 0);
  }, [index, query, recentKeys, currentModuleId, pathname]);

  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);

  // Any change to the result set invalidates the cursor.
  useEffect(() => {
    setSelected(0);
  }, [query, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    restoreFocusRef.current?.focus?.();
  }, [setOpen]);

  const run = useCallback(
    (entry: CommandEntry, newTab: boolean) => {
      setRecentKeys((prev) =>
        [entry.key, ...prev.filter((k) => k !== entry.key)].slice(0, MAX_RECENT_COMMANDS)
      );
      if (newTab) {
        window.open(entry.path, "_blank", "noopener,noreferrer");
        return;
      }
      close();
      router.push(entry.path);
    },
    [close, router, setRecentKeys]
  );

  // Global toggle. Lives here rather than in a provider: it is fifteen lines, and this
  // component is already mounted exactly where the shortcut should be live.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing) return;
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) return;

      // When open, Cmd+K always closes — including from the palette's own <input>,
      // which the editable-target guard below would otherwise swallow.
      if (open) {
        e.preventDefault();
        close();
        return;
      }
      // Don't hijack the shortcut out of a form the user is filling in.
      if (isEditableTarget(e.target)) return;
      // Ctrl+K is the browser's address-bar search on Windows.
      e.preventDefault();
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, setOpen]);

  // Focus the input and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    if (!restoreFocusRef.current && document.activeElement instanceof HTMLElement) {
      restoreFocusRef.current = document.activeElement;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    document.body.classList.add("dt-scroll-locked");
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("dt-scroll-locked");
    };
  }, [open]);

  // Keep the active option in view as the cursor moves.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`#dt-cmdk-opt-${selected}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected, open, groups]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (flat.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelected((i) => (i + 1) % flat.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelected((i) => (i - 1 + flat.length) % flat.length);
        break;
      case "Home":
        e.preventDefault();
        setSelected(0);
        break;
      case "End":
        e.preventDefault();
        setSelected(flat.length - 1);
        break;
      case "Enter": {
        e.preventDefault();
        const entry = flat[selected];
        if (entry) run(entry, e.metaKey || e.ctrlKey);
        break;
      }
      default:
        break;
    }
  };

  if (!open) return null;

  const shortcut = isMac ? "⌘K" : "Ctrl K";
  let cursor = -1;

  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className={s.box}>
        <div className={s.inputRow}>
          <div className={s.inputField}>
            <SearchIcon size="sm" />
            <input
              ref={inputRef}
              className={s.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search pages and products..."
              role="combobox"
              aria-expanded
              aria-controls="dt-cmdk-list"
              aria-activedescendant={flat.length ? `dt-cmdk-opt-${selected}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="kbd kbd-xs">esc</kbd>
          </div>
        </div>

        <div ref={listRef} className={s.list} id="dt-cmdk-list" role="listbox">
          {flat.length === 0 && (
            <p className={s.empty}>
              {query.trim()
                ? `No pages match “${query.trim()}”.`
                : "Start typing to search."}
            </p>
          )}

          {groups.map((group) => (
            <div key={group.id} role="group" aria-labelledby={`dt-cmdk-grp-${group.id}`}>
              <p className={s.groupLabel} id={`dt-cmdk-grp-${group.id}`}>
                {group.label}
              </p>
              {group.entries.map((entry) => {
                cursor += 1;
                const at = cursor;
                const isSelected = at === selected;
                const Icon = entry.icon;
                const meta = entry.sublabel ?? entry.parentLabel ?? entry.group;

                return (
                  <button
                    key={entry.key}
                    type="button"
                    id={`dt-cmdk-opt-${at}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`${s.option} ${isSelected ? s.optionSelected : s.optionIdle}`}
                    // Hover drives the same cursor the keyboard does, so the two can
                    // never point at different rows.
                    onMouseMove={() => setSelected(at)}
                    onClick={(e) => run(entry, e.metaKey || e.ctrlKey)}
                  >
                    {/* Spacer when an entry has no icon, so labels stay on one rail. */}
                    <span className={s.optionIconSlot} aria-hidden>
                      {Icon ? <Icon size={18} /> : null}
                    </span>
                    <span className={s.optionLabel}>{entry.label}</span>
                    <span className={s.optionMeta}>{meta}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className={s.footer}>
          <span aria-live="polite">
            {flat.length} {flat.length === 1 ? "result" : "results"}
          </span>
          <span>↑↓ move · ↵ open · {shortcut} close</span>
        </div>
      </div>

      {/* Clicking anywhere outside the box closes it. */}
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close command palette"
        onClick={close}
      />
    </div>
  );
}
