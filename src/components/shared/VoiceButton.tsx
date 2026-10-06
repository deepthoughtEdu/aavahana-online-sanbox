"use client";

import { Button } from "@/components/shared/Button";
import { MicIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import { bgColors, borderRadius, textColors } from "@/utils/shared/design.utils";

interface VoiceButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Global VoiceButton component for consistent mic/voice input UI across the app.
 * Positions absolutely at bottom-right of its relative parent container.
 * Usage: wrap your textarea in a `relative` div, then place <VoiceButton /> inside.
 */
export function VoiceButton({
  isRecording,
  isSupported,
  onClick,
  className,
  disabled,
}: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      color="secondary"
      iconBefore={<MicIcon size="sm" />}
      disabled={disabled}
      className={cn(
        "absolute bottom-3 right-3",
        "flex items-center justify-center",
        "hover:border-primary w-10 h-10 hover:text-primary",
        borderRadius.rounded,
        "cursor-pointer",
        isRecording
          ? ["voice-ripple-animation", bgColors.accent, textColors.primary]
          : textColors.secondary,
        className
      )}
    />
  );
}
