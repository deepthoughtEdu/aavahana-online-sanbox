import { ReactNode } from "react";
import { cn } from "@/utils"; // or your utility function
import { pageHeaderStyles } from "@/utils/shared/design.utils";

interface PageHeaderProps {
  title: string;
  label?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  label,
  subtitle,
  children,
  className
}: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderStyles.wrapper, className)}>
      <div className={pageHeaderStyles.content}>
        {/* Title Section */}
        <div className={pageHeaderStyles.titleSection}>
          {label && (
            <p className={pageHeaderStyles.label}>
              {label}
            </p>
          )}
          <h3 className={pageHeaderStyles.title}>
            {title}
          </h3>
          {subtitle && (
            <p className={pageHeaderStyles.subtitleWithMargin}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions Section - Only if children exist */}
        {children && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}