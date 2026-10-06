import { cn } from "@/utils";
import React from "react";
import { overlayLoadingSizes, borderRadius } from "@/utils/shared/design.utils";

interface OverlayLoadingProps {
  title?: string;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  overlayContainerClassName?: string;
  size?: keyof typeof overlayLoadingSizes;
}

export const OverlayLoading: React.FC<OverlayLoadingProps> = ({
  title = "Loading...",
  className,
  overlayClassName,
  contentClassName,
  overlayContainerClassName,
  size = "md",
}) => {
  //  Get size config from centralized tokens
  const sizeConfig = overlayLoadingSizes[size];

  return (
    <div className={overlayContainerClassName}>
      <div
        className={cn(
          "absolute inset-0 bg-white/60 z-10 flex items-center justify-center",
          overlayClassName
        )}
      >
        <div
          className={cn(
            "flex items-center",
            sizeConfig.padding,
            sizeConfig.gap,
            borderRadius.md,
            contentClassName,
            className
          )}
        >
          <span
            className={cn(
              "loading loading-spinner text-primary",
              sizeConfig.spinner
            )}
          />
          <span
            className={cn(
              "font-medium text-neutral",
              sizeConfig.text
            )}
          >
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};