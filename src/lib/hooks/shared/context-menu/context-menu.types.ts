export interface MenuOption {
  value?: string;
  label?: string | null;
  icon?: React.ReactNode;
  callback?: (value: string) => void;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  submenu?: MenuOption[];
}

export interface UseContextMenuConfig {
  options: MenuOption[];
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface MenuPosition {
  x: number;
  y: number;
}

export interface SubmenuState {
  parentIndex: number | null;
  isOpen: boolean;
}

export const MENU_MIN_WIDTH = 200;
export const MENU_PADDING = 8;
export const SUBMENU_OFFSET = 4;

export function isDivider(option: MenuOption): boolean {
  return (
    (option.label === null || option.label === undefined) &&
    !option.value &&
    !option.callback
  );
}
