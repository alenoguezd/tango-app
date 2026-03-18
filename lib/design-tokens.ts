/**
 * Design Token System
 * Single source of truth for all design values
 * Never hardcode colors/radius outside this file
 */

export const tokens = {
  color: {
    page: "#FAFAF8",
    surface: "#FFFFFF",
    sage: "#A8C87A",
    rose: "#F2B8CD",
    butter: "#F5DC7A",
    sky: "#B8CEEA",
    ink: "#1A1A1A",
    muted: "#B0A898",
    border: "#EEEBE6",
  },
  radius: {
    card: "14px",
    btn: "50px",
  },
} as const;

// Semantic color aliases for common use cases
export const semanticColors = {
  text: {
    primary: tokens.color.ink,
    secondary: tokens.color.muted,
    muted: tokens.color.muted,
  },
  bg: {
    page: tokens.color.page,
    surface: tokens.color.surface,
  },
  accent: {
    primary: tokens.color.sage,
    secondary: tokens.color.sky,
    tertiary: tokens.color.rose,
    highlight: tokens.color.butter,
  },
  interactive: {
    border: tokens.color.border,
  },
} as const;
