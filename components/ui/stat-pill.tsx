"use client";

import { tokens } from "@/lib/design-tokens";

interface StatPillProps {
  label: string;
  value: number | string;
}

/**
 * StatPill
 * White card displaying a stat: large value above small label
 * Used for: "Para hoy", "Tarjetas", "Dominadas"
 *
 * Usage:
 *   <StatPill label="Para hoy" value={5} />
 *   <StatPill label="Tarjetas" value={42} />
 */
export function StatPill({ label, value }: StatPillProps) {
  return (
    <div
      style={{
        flex: 1,
        background: tokens.color.surface,
        border: `0.5px solid ${tokens.color.border}`,
        borderRadius: "12px",
        padding: tokens.spacing["4"],
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacing["2"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          fontFamily: tokens.typography.family.ui,
          fontSize: tokens.typography.size.lg,
          fontWeight: tokens.typography.weight.medium,
          lineHeight: tokens.typography.lineHeight.tight,
          color: tokens.color.ink,
          margin: 0,
        }}
      >
        {value}
      </p>
      <span
        style={{
          fontFamily: tokens.typography.family.ui,
          fontSize: tokens.typography.size.xs,
          fontWeight: tokens.typography.weight.regular,
          lineHeight: tokens.typography.lineHeight.tight,
          color: tokens.color.muted,
          margin: 0,
        }}
      >
        {label}
      </span>
    </div>
  );
}
