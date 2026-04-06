"use client";

import { tokens } from "@/lib/design-tokens";

interface AvatarProps {
  initials: string;
  size?: number;
  backgroundColor?: string;
}

/**
 * Avatar
 * Circular user avatar displaying initials
 *
 * Usage:
 *   <Avatar initials="AJ" />
 *   <Avatar initials="AB" size={48} backgroundColor={tokens.color.sky} />
 */
export function Avatar({
  initials,
  size = 38,
  backgroundColor = tokens.color.rose,
}: AvatarProps) {
  const displayInitials = initials.toUpperCase().slice(0, 2);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: tokens.typography.family.ui,
          fontSize: `${size * 0.4}px`,
          fontWeight: tokens.typography.weight.bold,
          lineHeight: tokens.typography.lineHeight.tight,
          color: tokens.color.ink,
        }}
      >
        {displayInitials}
      </span>
    </div>
  );
}
