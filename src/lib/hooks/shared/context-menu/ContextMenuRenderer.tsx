'use client';

import { useCallback, useMemo } from 'react';
import type { MenuOption, MenuPosition, SubmenuState } from './context-menu.types';
import { MENU_MIN_WIDTH, MENU_PADDING, SUBMENU_OFFSET, isDivider } from './context-menu.types';

interface ContextMenuRendererProps {
  isOpen: boolean;
  adjustedPosition: MenuPosition;
  className: string;
  options: MenuOption[];
  focusedIndex: number;
  submenuState: SubmenuState;
  navigableOptions: { option: MenuOption; index: number }[];
  handleOptionClick: (option: MenuOption) => void;
  handleSubmenuOpen: (index: number) => void;
  handleSubmenuClose: () => void;
  cancelSubmenuClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  submenuRef: React.RefObject<HTMLDivElement | null>;
}

export function useContextMenuRenderer({
  isOpen, adjustedPosition, className, options,
  focusedIndex, submenuState, navigableOptions,
  handleOptionClick, handleSubmenuOpen, handleSubmenuClose, cancelSubmenuClose,
  menuRef, submenuRef,
}: ContextMenuRendererProps) {
  const renderOption = useCallback((option: MenuOption, index: number, isSubmenu = false) => {
    if (isDivider(option)) {
      return (
        <div
          key={`divider-${index}`}
          className="h-px bg-base-300 my-1"
          role="separator"
        />
      );
    }

    const hasSubmenu = option.submenu && option.submenu.length > 0;
    const isFocused = !isSubmenu && navigableOptions.findIndex(item => item.index === index) === focusedIndex;
    const isSubmenuOpen = submenuState.parentIndex === index && submenuState.isOpen;

    return (
      <button
        key={option.value || `option-${index}`}
        type="button"
        className={`
          w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm
          transition-colors duration-150
          ${option.disabled
            ? 'text-[var(--dt-textDim)] cursor-not-allowed'
            : option.danger
              ? 'text-error hover:bg-error/10'
              : 'text-black hover:bg-base-200'
          }
          ${isFocused ? 'bg-base-200' : ''}
          ${isSubmenuOpen ? 'bg-base-200' : ''}
        `}
        disabled={option.disabled}
        onClick={() => !hasSubmenu && handleOptionClick(option)}
        onMouseEnter={() => hasSubmenu && handleSubmenuOpen(index)}
        onMouseLeave={() => hasSubmenu && handleSubmenuClose()}
        role="menuitem"
        aria-disabled={option.disabled}
        aria-haspopup={hasSubmenu ? 'menu' : undefined}
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {option.icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {option.icon}
            </span>
          )}
          <span className="truncate">{option.label}</span>
        </span>

        {option.shortcut && (
          <span className="text-xs text-[var(--dt-textDim)] flex-shrink-0">
            {option.shortcut}
          </span>
        )}

        {hasSubmenu && (
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    );
  }, [focusedIndex, navigableOptions, submenuState, handleOptionClick, handleSubmenuOpen, handleSubmenuClose]);

  const renderSubmenu = useCallback((parentOption: MenuOption, parentIndex: number) => {
    if (!submenuState.isOpen || submenuState.parentIndex !== parentIndex) return null;
    if (!parentOption.submenu || parentOption.submenu.length === 0) return null;

    const parentButton = menuRef.current?.querySelector(`[data-option-index="${parentIndex}"]`);
    const parentRect = parentButton?.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();
    if (!parentRect || !menuRect) return null;

    let submenuX = menuRect.right + SUBMENU_OFFSET;
    const submenuY = parentRect.top;
    const viewportWidth = window.innerWidth;

    if (submenuX + MENU_MIN_WIDTH > viewportWidth - MENU_PADDING) {
      submenuX = menuRect.left - MENU_MIN_WIDTH - SUBMENU_OFFSET;
    }

    return (
      <div
        ref={submenuRef}
        className={`fixed z-[10001] bg-white border border-base-300 rounded-lg shadow-xl py-1 animate-fade-in ${className}`}
        style={{ left: `${submenuX}px`, top: `${submenuY}px`, minWidth: `${MENU_MIN_WIDTH}px` }}
        role="menu"
        aria-label="Submenu"
        onMouseEnter={cancelSubmenuClose}
        onMouseLeave={handleSubmenuClose}
      >
        {parentOption.submenu.map((subOption, subIndex) =>
          renderOption(subOption, subIndex, true)
        )}
      </div>
    );
  }, [submenuState, className, renderOption, cancelSubmenuClose, handleSubmenuClose, menuRef, submenuRef]);

  const ContextMenuComponent = useMemo(() => {
    if (!isOpen) return null;

    return (
      <>
        <div
          ref={menuRef}
          className={`fixed z-[10000] bg-white border border-base-300 rounded-lg shadow-xl py-1 animate-fade-in ${className}`}
          style={{ left: `${adjustedPosition.x}px`, top: `${adjustedPosition.y}px`, minWidth: `${MENU_MIN_WIDTH}px` }}
          role="menu"
          aria-label="Context menu"
          aria-orientation="vertical"
        >
          {options.map((option, index) => {
            const optionElement = renderOption(option, index);
            if (option.submenu && option.submenu.length > 0) {
              return (
                <div key={option.value || `option-wrapper-${index}`} data-option-index={index}>
                  {optionElement}
                </div>
              );
            }
            return optionElement;
          })}
        </div>
        {submenuState.isOpen && submenuState.parentIndex !== null &&
          renderSubmenu(options[submenuState.parentIndex], submenuState.parentIndex)
        }
      </>
    );
  }, [isOpen, adjustedPosition, className, options, renderOption, submenuState, renderSubmenu, menuRef]);

  return ContextMenuComponent;
}
