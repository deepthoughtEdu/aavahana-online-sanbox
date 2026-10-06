// src/lib/hooks/use-alert.ts
'use client';

import { useCallback } from 'react';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

// ============================================================================
// TYPES
// ============================================================================

export type AlertType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'question'
  | 'delete'
  | 'confirm';

export interface AlertOptions {
  /** Type of alert - affects icon and button colors */
  type?: AlertType;
  
  /** Main title/heading */
  title?: string;
  
  /** Detailed message/description */
  message?: string;
  
  /** HTML content (overrides message if provided) */
  html?: string;
  
  /** Resource name for auto-generating messages (e.g., "User", "Product") */
  resourceName?: string;
  
  /** Resource is plural (affects auto-generated messages) */
  plural?: boolean;
  
  /** Confirm button text (defaults based on type) */
  confirmText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Show cancel button (defaults: true for confirm/delete, false for info/success) */
  showCancel?: boolean;
  
  /** Input field for user entry */
  input?: SweetAlertOptions['input'];
  
  /** Input placeholder */
  inputPlaceholder?: string;
  
  /** Input validator function */
  inputValidator?: SweetAlertOptions['inputValidator'];
  
  /** Custom icon (overrides type-based icon) */
  icon?: string;
  
  /** Additional SweetAlert2 options */
  customOptions?: Partial<SweetAlertOptions>;
}

interface PresetConfig {
  icon: SweetAlertOptions['icon'];
  confirmButtonColor: string;
  cancelButtonColor?: string;
  defaultConfirmText: string;
  defaultCancelText: string;
  showCancelButton: boolean;
}

// ============================================================================
// DESIGN SYSTEM COLORS - SweetAlert2 needs actual color values
// ============================================================================
// SweetAlert2 requires raw hex values — CSS vars don't resolve in its style injection.
// These MUST stay in sync with theme.css manually.
// Sync check: primary=#0029ff≈--dt-teal(#0033ff), success=#22c55e≈--dt-green(#2e7d32),
//   warning=#f59e0b≈--dt-amber(#e6a700), error=#ef4444≈--dt-red(#c62828)
// NOTE: SweetAlert hues diverge from theme.css — intentional for popup contrast.

const COLORS = {
  primary: '#0029ff',      // rgba(0, 41, 255, 1)
  secondary: '#cccccc',    // rgba(204, 204, 204, 1)
  success: '#22c55e',      // Green from oklch conversion
  warning: '#f59e0b',      // Amber from oklch conversion
  error: '#ef4444',        // Red from oklch conversion
  neutral: '#737373',      // Gray-500
  info: '#0029ff',         // Same as primary
} as const;

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

const PRESETS: Record<AlertType, PresetConfig> = {
  info: {
    icon: 'info',
    confirmButtonColor: COLORS.info,
    defaultConfirmText: 'Got it',
    defaultCancelText: 'Close',
    showCancelButton: false,
  },
  success: {
    icon: 'success',
    confirmButtonColor: COLORS.success,
    defaultConfirmText: 'Great!',
    defaultCancelText: 'Close',
    showCancelButton: false,
  },
  warning: {
    icon: 'warning',
    confirmButtonColor: COLORS.warning,
    defaultConfirmText: 'I Understand',
    defaultCancelText: 'Cancel',
    showCancelButton: true,
  },
  error: {
    icon: 'error',
    confirmButtonColor: COLORS.error,
    defaultConfirmText: 'Okay',
    defaultCancelText: 'Close',
    showCancelButton: false,
  },
  question: {
    icon: 'question',
    confirmButtonColor: COLORS.primary,
    defaultConfirmText: 'Yes',
    defaultCancelText: 'No',
    showCancelButton: true,
  },
  confirm: {
    icon: 'question',
    confirmButtonColor: COLORS.primary,
    defaultConfirmText: 'Confirm',
    defaultCancelText: 'Cancel',
    showCancelButton: true,
  },
  delete: {
    icon: 'warning',
    confirmButtonColor: COLORS.error,
    cancelButtonColor: COLORS.neutral,
    defaultConfirmText: 'Delete',
    defaultCancelText: 'Cancel',
    showCancelButton: true,
  },
} as const;

// ============================================================================
// MESSAGE GENERATORS
// ============================================================================

const generateTitle = (
  type: AlertType,
  resourceName?: string,
  plural?: boolean
): string => {
  if (!resourceName) {
    return {
      info: 'Information',
      success: 'Success!',
      warning: 'Warning',
      error: 'Error',
      question: 'Are you sure?',
      confirm: 'Please Confirm',
      delete: 'Delete Confirmation',
    }[type];
  }

  const resource = plural ? `${resourceName}s` : resourceName;
  
  switch (type) {
    case 'delete':
      return `Delete ${resource}?`;
    case 'confirm':
      return `Confirm ${resource}`;
    case 'success':
      return `${resource} ${plural ? 'were' : 'was'} successful!`;
    case 'error':
      return `${resource} Failed`;
    case 'warning':
      return `${resource} Warning`;
    default:
      return resourceName;
  }
};

const generateMessage = (
  type: AlertType,
  resourceName?: string,
  plural?: boolean
): string => {
  if (!resourceName) return '';

  const resource = resourceName.toLowerCase();
  const article = plural ? 'these' : 'this';
  const verb = plural ? 'are' : 'is';
  
  switch (type) {
    case 'delete':
      return `Are you sure you want to delete ${article} ${resource}${plural ? 's' : ''}? This action cannot be undone.`;
    case 'confirm':
      return `Please confirm you want to proceed with ${article} ${resource}${plural ? 's' : ''}.`;
    case 'success':
      return `${resourceName}${plural ? 's' : ''} ${verb === 'are' ? 'have' : 'has'} been processed successfully.`;
    case 'error':
      return `There was an error processing ${article} ${resource}${plural ? 's' : ''}.`;
    case 'warning':
      return `Please review ${article} ${resource}${plural ? 's' : ''} before proceeding.`;
    default:
      return '';
  }
};

// ============================================================================
// HOOK
// ============================================================================

export function useAlert() {
  const alert = useCallback(async (options: AlertOptions = {}): Promise<SweetAlertResult> => {
    const {
      type = 'confirm',
      title,
      message,
      html,
      resourceName,
      plural = false,
      confirmText,
      cancelText,
      showCancel,
      input,
      inputPlaceholder,
      inputValidator,
      icon,
      customOptions = {},
    } = options;

    // Get preset configuration
    const preset = PRESETS[type];

    // Build final title and message
    const finalTitle = title ?? generateTitle(type, resourceName, plural);
    const finalMessage = message ?? generateMessage(type, resourceName, plural);

    // Build SweetAlert2 configuration
    // Note: We build this as a plain object because SweetAlertOptions uses complex
    // discriminated unions based on the 'input' type that make it difficult to
    // construct incrementally with proper typing
    const swalConfig = {
      // Content
      title: finalTitle,
      text: html ? undefined : finalMessage,
      html: html || undefined,
      icon: (icon as SweetAlertOptions['icon']) ?? preset.icon,

      // Buttons
      showCancelButton: showCancel ?? preset.showCancelButton,
      confirmButtonText: confirmText ?? preset.defaultConfirmText,
      cancelButtonText: cancelText ?? preset.defaultCancelText,
      confirmButtonColor: preset.confirmButtonColor,
      cancelButtonColor: preset.cancelButtonColor ?? COLORS.neutral,

      // Styling (matching your design system)
      customClass: {
        popup: 'rounded-lg shadow-xl border border-base-300',
        title: 'text-2xl font-bold text-black',
        htmlContainer: 'text-black/80 text-base',
        confirmButton: '!shadow-none !py-1.5 !font-medium',
        cancelButton: '!shadow-none !py-1.5 !font-medium',
        actions: 'gap-3 mt-6',
        input: 'input input-bordered w-full',
      },
      
      buttonsStyling: true, // Use SweetAlert2's default button styling with our colors
      
   
      // Behavior
      focusConfirm: true,
      reverseButtons: false,
      allowOutsideClick: true,
      allowEscapeKey: true,

      // Add input-related options if provided
      ...(input && {
        input,
        ...(inputPlaceholder && { inputPlaceholder }),
        ...(inputValidator && { inputValidator }),
      }),

      // Merge custom options (allows override)
      ...customOptions,
    };

    return Swal.fire(swalConfig as SweetAlertOptions);
  }, []);

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  const info = useCallback(
    (options: Omit<AlertOptions, 'type'> = {}) => 
      alert({ ...options, type: 'info' }),
    [alert]
  );

  const success = useCallback(
    (options: Omit<AlertOptions, 'type'> = {}) => 
      alert({ ...options, type: 'success' }),
    [alert]
  );

  const warning = useCallback(
    (options: Omit<AlertOptions, 'type'> = {}) => 
      alert({ ...options, type: 'warning' }),
    [alert]
  );

  const error = useCallback(
    (options: Omit<AlertOptions, 'type'> = {}) => 
      alert({ ...options, type: 'error' }),
    [alert]
  );

  const question = useCallback(
    (options: Omit<AlertOptions, 'type'> = {}) => 
      alert({ ...options, type: 'question' }),
    [alert]
  );

  const confirm = useCallback(
    (options: AlertOptions = {}) => 
      alert({ ...options }),
    [alert]
  );

  const deleteAlert = useCallback(
    (options: Omit<AlertOptions, 'type'> = {}) => 
      alert({ ...options, type: 'delete' }),
    [alert]
  );

  return {
    alert,
    info,
    success,
    warning,
    error,
    question,
    confirm,
    delete: deleteAlert,
  };
}