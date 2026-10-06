import React from "react";
import { IconBox } from "./IconBox";
import { sectionHeaderSizes, containerPadding, horizontalPadding, verticalPadding } from "@/utils/shared/design.utils";

// ============================================================================
// Types
// ============================================================================

export interface SectionProps {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "bordered" | "ghost" | "dark";
}

export interface SectionHeaderProps {
    icon?: React.ReactNode;
    title: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    size?: keyof typeof sectionHeaderSizes;
    noGutter?: boolean | { x?: boolean; y?: boolean };
}

export interface SectionBodyProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean | { x?: boolean; y?: boolean };
}

export interface SectionFooterProps {
    children: React.ReactNode;
    className?: string;
}

// ============================================================================
// Main Section Component
// ============================================================================

const SectionRoot: React.FC<SectionProps> = ({
    children,
    className = "",
    variant = "default",
}) => {
    const variantStyles = {
        default: "bg-white border border-base-300 rounded-[9px] overflow-hidden",
        bordered: "border-2 border-base-300 rounded-[9px] overflow-hidden",
        ghost: "bg-transparent",
        dark: "border border-base-300 rounded-lg overflow-hidden",
    };

    return (
        <div className={`${variantStyles[variant]} ${className}`}>
            {children}
        </div>
    );
};

// ============================================================================
// Section.Header
// ============================================================================

const SectionHeader: React.FC<SectionHeaderProps> = ({
    icon,
    title,
    subtitle,
    children,
    className = "",
    size = "md",
    noGutter,
}) => {
    const sizeStyles = sectionHeaderSizes[size];

    const gutterClasses = (() => {
        if (noGutter === true) return `${horizontalPadding.none} ${verticalPadding.none}`;
        if (typeof noGutter === "object") {
            const { x, y } = noGutter;
            return `${x ? horizontalPadding.none : ""} ${y ? verticalPadding.none : ""}`.trim();
        }
        return "";
    })();

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center w-full justify-between gap-3 sm:gap-0 border-b border-base-300 bg-white ${sizeStyles.container} ${gutterClasses} ${className}`}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && <IconBox icon={icon} color="primary" size={size} isActive />}
                <div className="min-w-0 flex-1">
                    <h3 className={`text-black font-semibold ${sizeStyles.title} truncate`}>
                        {title}
                    </h3>
                    {subtitle && (
                        <p className={`text-neutral ${sizeStyles.subtitle} truncate`}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
        </div>
    );
};

// ============================================================================
// Section.Body
// ============================================================================

const SectionBody: React.FC<SectionBodyProps> = ({
    children,
    className = "",
    noPadding,
}) => {
    const paddingClasses = (() => {
        if (noPadding === true) return containerPadding.none;
        if (typeof noPadding === "object") {
            const { x, y } = noPadding;
            return `${x ? horizontalPadding.none : horizontalPadding.xl} ${y ? verticalPadding.none : verticalPadding.xl}`.trim();
        }
        return containerPadding.xl;
    })();

    return (
        <div className={`bg-white ${paddingClasses} ${className}`}>
            {children}
        </div>
    );
};

// ============================================================================
// Section.Footer
// ============================================================================

const SectionFooter: React.FC<SectionFooterProps> = ({
    children,
    className = "",
}) => {
    return (
        <div
            className={`border-t border-base-300 bg-[var(--dt-surfaceAlt)] ${containerPadding.md} ${className}`}
        >
            {children}
        </div>
    );
};

// ============================================================================
// Compound Component Export
// ============================================================================

export const Section = Object.assign(SectionRoot, {
    Header: SectionHeader,
    Body: SectionBody,
    Footer: SectionFooter,
});