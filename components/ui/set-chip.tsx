"use client";

import { tokens } from "@/lib/design-tokens";

interface SetChipProps {
  type: "due" | "aldía";
  count?: number;
}

/**
 * SetChip
 * Status badge for set cards: "due" (butter) or "aldía" (green)
 *
 * Usage:
 *   <SetChip type="due" count={3} />
 *   <SetChip type="aldía" />
 */
export function SetChip({ type, count }: SetChipProps) {
  const isDue = type === "due";
  const backgroundColor = isDue ? tokens.color.butter : tokens.color.softGreen;
  const textColor = isDue ? tokens.color.butterText : tokens.color.softGreenText;

  const displayText = isDue
    ? count
      ? `${count} para hoy`
      : "Para hoy"
    : "Al día";

  return (
    <div
      style={{
        background: backgroundColor,
        borderRadius: "50px",
        padding: `${tokens.spacing["1"]} ${tokens.spacing["3"]}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: tokens.typography.family.ui,
          fontSize: tokens.typography.size.xs,
          fontWeight: tokens.typography.weight.semibold,
          lineHeight: tokens.typography.lineHeight.tight,
          color: textColor,
        }}
      >
        {displayText}
      </span>
    </div>
  );
}
