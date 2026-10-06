import { cn } from "@/utils";
import React from "react";
import {
  iconBoxSizes,
  borderRadius,
  getColoredBox,
  type ColorVariant,
  Shape,
} from "@/utils/shared/design.utils";

interface IconBoxProps {
  /** Icon element (Lucide or any ReactNode) or text/initials */
  icon?: React.ReactNode;

  color?: ColorVariant;
  size?: keyof typeof iconBoxSizes;
  shape?: Shape;
  isActive?: boolean;
  className?: string;
}
export const IconBox: React.FC<IconBoxProps> = ({
  icon,
  color = "primary",
  size = "md",
  shape = "default",
  isActive = false,
  className = "",
}) => {
  const sizeConfig = iconBoxSizes[size];
  const shapeClasses = {
    square: borderRadius.none,
    default: borderRadius.md,
    rounded: borderRadius.rounded,
  };
  const colorClasses = getColoredBox(color, isActive);

  //  Determine font size in px for initials based on padding/size
  const fontSizeStyle: React.CSSProperties = typeof icon == "string"
    ? {
      fontSize:
        size === "sm" ? 10 : size === "md" ? 12 : size === "lg" ? 14 : 18,
      lineHeight: 1,
      width: '100%',
      height: '100%',
      'textAlign': 'center'
    }
    : {};

  const classes = cn(
    "inline-flex items-center justify-center transition-colors duration-200 font-medium",
    sizeConfig.padding,
    sizeConfig.text,
    shapeClasses[shape],
    colorClasses.bg,
    colorClasses.text,
    className
  );

  return (
    <span className={classes} style={fontSizeStyle}>
      {icon}
    </span>
  );
};