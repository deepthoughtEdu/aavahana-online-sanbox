'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { MenuOption, UseContextMenuConfig, MenuPosition, SubmenuState } from './context-menu/context-menu.types';
import { MENU_PADDING } from './context-menu/context-menu.types';
import { useContextMenuRenderer } from './context-menu/ContextMenuRenderer';

export type { MenuOption, UseContextMenuConfig };

export function useContextMenu(config: UseContextMenuConfig) {
  const { options, className = '' } = config;

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [submenuState, setSubmenuState] = useState<SubmenuState>({ parentIndex: null, isOpen: false });

  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigableOptions = useMemo(() => {
    return options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => option.label !== null && option.label !== undefined && !option.disabled);
  }, [options]);

  // Position calculation
  const calculatePosition = useCallback((x: number, y: number, menuElement: HTMLElement | null) => {
    if (!menuElement) return { x, y };
    const menuRect = menuElement.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let ax = x, ay = y;
    if (x + menuRect.width > vw - MENU_PADDING) ax = vw - menuRect.width - MENU_PADDING;
    if (y + menuRect.height > vh - MENU_PADDING) ay = vh - menuRect.height - MENU_PADDING;
    if (ax < MENU_PADDING) ax = MENU_PADDING;
    if (ay < MENU_PADDING) ay = MENU_PADDING;
    return { x: ax, y: ay };
  }, []);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      setAdjustedPosition(calculatePosition(position.x, position.y, menuRef.current));
    }
  }, [isOpen, position, calculatePosition]);

  const openContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
    setFocusedIndex(-1);
    setSubmenuState({ parentIndex: null, isOpen: false });
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setSubmenuState({ parentIndex: null, isOpen: false });
    if (submenuTimeoutRef.current) { clearTimeout(submenuTimeoutRef.current); submenuTimeoutRef.current = null; }
  }, []);

  const handleOptionClick = useCallback((option: MenuOption) => {
    if (option.disabled) return;
    if (option.submenu && option.submenu.length > 0) return;
    if (option.callback && option.value) option.callback(option.value);
    closeContextMenu();
  }, [closeContextMenu]);

  // Keyboard navigation
  const navigate = useCallback((direction: 'up' | 'down') => {
    if (navigableOptions.length === 0) return;
    setFocusedIndex((current) => {
      if (current === -1) return direction === 'down' ? 0 : navigableOptions.length - 1;
      if (direction === 'down') return current >= navigableOptions.length - 1 ? 0 : current + 1;
      return current <= 0 ? navigableOptions.length - 1 : current - 1;
    });
  }, [navigableOptions.length]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    switch (event.key) {
      case 'Escape': event.preventDefault(); closeContextMenu(); break;
      case 'ArrowDown': event.preventDefault(); navigate('down'); break;
      case 'ArrowUp': event.preventDefault(); navigate('up'); break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < navigableOptions.length) handleOptionClick(navigableOptions[focusedIndex].option);
        break;
      case 'ArrowRight':
        if (focusedIndex >= 0 && focusedIndex < navigableOptions.length) {
          const { option, index } = navigableOptions[focusedIndex];
          if (option.submenu?.length) { event.preventDefault(); setSubmenuState({ parentIndex: index, isOpen: true }); }
        }
        break;
      case 'ArrowLeft':
        if (submenuState.isOpen) { event.preventDefault(); setSubmenuState({ parentIndex: null, isOpen: false }); }
        break;
    }
  }, [isOpen, focusedIndex, navigableOptions, navigate, handleOptionClick, closeContextMenu, submenuState.isOpen]);

  // Event listeners
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          (!submenuRef.current || !submenuRef.current.contains(event.target as Node))) {
        closeContextMenu();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClickOutside); };
  }, [isOpen, closeContextMenu]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Submenu handlers
  const handleSubmenuOpen = useCallback((index: number) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    submenuTimeoutRef.current = setTimeout(() => setSubmenuState({ parentIndex: index, isOpen: true }), 200);
  }, []);

  const handleSubmenuClose = useCallback(() => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    submenuTimeoutRef.current = setTimeout(() => setSubmenuState({ parentIndex: null, isOpen: false }), 200);
  }, []);

  const cancelSubmenuClose = useCallback(() => {
    if (submenuTimeoutRef.current) { clearTimeout(submenuTimeoutRef.current); submenuTimeoutRef.current = null; }
  }, []);

  // Rendering
  const ContextMenuComponent = useContextMenuRenderer({
    isOpen, adjustedPosition, className, options,
    focusedIndex, submenuState, navigableOptions,
    handleOptionClick, handleSubmenuOpen, handleSubmenuClose, cancelSubmenuClose,
    menuRef, submenuRef,
  });

  return { openContextMenu, closeContextMenu, ContextMenuComponent };
}
