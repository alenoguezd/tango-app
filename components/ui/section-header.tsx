"use client";

import { tokens } from "@/lib/design-tokens";

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * SectionHeader
 * Section heading with optional action link (e.g. "Mis sets" with "Ver todos")
 *
 * Usage:
 *   <SectionHeader title="Mis sets" action={{ label: "Ver todos", onClick: handleViewAll }} />
 *   <SectionHeader title="Por set" />
 */
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: tokens.spacing["5"],
      }}
    >
      <h2
        style={{
          fontFamily: tokens.typography.family.ui,
          fontSize: tokens.typography.size.lg,
          fontWeight: tokens.typography.weight.bold,
          lineHeight: tokens.typography.lineHeight.normal,
          color: tokens.color.ink,
          margin: 0,
        }}
      >
        {title}
      </h2>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: "none",
            border: "none",
            fontFamily: tokens.typography.family.ui,
            fontSize: tokens.typography.size.base,
            fontWeight: tokens.typography.weight.semibold,
            color: tokens.color.sage,
            cursor: "pointer",
            padding: 0,
            textDecoration: "none",
          }}
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
