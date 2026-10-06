// src/components/shared/Modal.tsx
'use client';

import React from 'react';
import { Section } from './Section';
import { CloseIcon } from './icons';
import { Button } from './Button';
import { modalStyles } from '@/utils/shared/design.utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * The size class sets `--dt-modal-w` in components.css, which is what caps the box
 * below AND what the sidebar-offset maths reads. One variable, so a modal cannot
 * render at one width while the centring assumes another. The rem values live in
 * the CSS, not here.
 */
const sizeClasses: Record<ModalSize, string> = {
    sm: 'dt-modal--sm',
    md: 'dt-modal--md',
    lg: 'dt-modal--lg',
    xl: 'dt-modal--xl',
};

export interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode; // Body content
    footer?: React.ReactNode;   // Optional footer
    /**
     * How wide the box may get. `lg` suits most screens, including two-column ones.
     * Reach for `xl` only when the content genuinely needs the room — a modal wider
     * than the content area beside the sidebar cannot be centred in it, and slides
     * over the sidebar instead.
     */
    size?: ModalSize;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    footer,
    size = 'lg',
    className = '',
}) => {
    if (!isOpen) return null;

    return (
        <div className={`modal modal-open ${sizeClasses[size]}`}>
            <div className={`modal-box w-11/12 max-w-[var(--dt-modal-w,56rem)] max-h-[92vh] sm:w-full overflow-hidden flex flex-col p-0 ${className}`}>
                {/* Header */}
                <Section.Header icon={icon} title={title} subtitle={subtitle}>
                    {onClose && <Button
                        square
                        color='secondary'
                        onClick={onClose}
                        iconBefore={<CloseIcon size='sm' />}
                        aria-label="Close"
                    />}
                </Section.Header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="sticky bottom-0 z-20 bg-white border-t border-base-300 px-4 py-3 sm:px-6">
                        {footer}
                    </div>
                )}
            </div>

            {/* Backdrop */}
            <div className={modalStyles.backdrop} onClick={onClose}></div>
        </div>
    );
};
