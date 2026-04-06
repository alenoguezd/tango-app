"use client";

import { tokens } from "@/lib/design-tokens";

interface PageTitleProps {
  children: string;
}

/**
 * PageTitle
 * Standardized heading for main page sections (Inicio, Progreso, Crear, Perfil)
 *
 * Usage:
 *   <PageTitle>Progreso</PageTitle>
 *   <PageTitle>Nuevo set</PageTitle>
 */
export function PageTitle({ children }: PageTitleProps) {
  return (
    <h1
      style={{
        fontFamily: tokens.typography.family.ui,
        fontSize: tokens.typography.size["2xl"],
        fontWeight: tokens.typography.weight.medium,
        lineHeight: tokens.typography.lineHeight.tight,
        color: tokens.color.ink,
        margin: `0 0 ${tokens.spacing["6"]} 0`,
      }}
    >
      {children}
    </h1>
  );
}
