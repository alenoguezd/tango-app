/**
 * Design Token System
 * Single source of truth for all design values
 * Never hardcode colors/radius outside this file
 */

export const tokens = {
  color: {
    // Core colors
    page: "#F5F4F0",
    surface: "#FFFFFF",
    sage: "#A8C87A",
    rose: "#F2B8CD",
    butter: "#F5DC7A",
    sky: "#B8CEEA",
    ink: "#1A1A1A",
    muted: "#8A7F74",
    border: "#EEEBE6",

    // Semantic text colors
    textSuccess: "#2A5010",
    textError: "#A01030",
    textWarning: "#6B5500",
    textBlue: "#5B9FD8",

    // Light background variants
    bgSageSoft: "#E8F4D8",
    bgSageSuccess: "#E0F2E0",
    bgSkyLight: "#E8F2F9",
    bgRoseSoft: "#FFE5F0",
    bgButterLight: "#FFF4E0",
    bgGrey: "#E8E8E8",
    bgSubtle: "#F5F5F5",
    bgHover: "#F8F8F8",
    bgDesktopPage: "#F7F6F3",

    // Component colors
    progressTrack: "#E0DCD4",
    navPill: "#F0F0F0",
    progressIndent: "#111",
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
    success: tokens.color.textSuccess,
    error: tokens.color.textError,
    warning: tokens.color.textWarning,
    blue: tokens.color.textBlue,
  },
  bg: {
    page: tokens.color.page,
    surface: tokens.color.surface,
    sageSoft: tokens.color.bgSageSoft,
    sageSuccess: tokens.color.bgSageSuccess,
    skyLight: tokens.color.bgSkyLight,
    roseSoft: tokens.color.bgRoseSoft,
    butterLight: tokens.color.bgButterLight,
    grey: tokens.color.bgGrey,
    subtle: tokens.color.bgSubtle,
    hover: tokens.color.bgHover,
    desktopPage: tokens.color.bgDesktopPage,
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
