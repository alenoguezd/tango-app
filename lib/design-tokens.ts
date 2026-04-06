/**
 * Design Token System
 * Single source of truth for all design values
 * Never hardcode colors/radius outside this file
 */

export const tokens = {
  // ──────────────────────────────────────────────────────────────
  // Typography scale — font sizes, weights, heights, families
  // ──────────────────────────────────────────────────────────────
  typography: {
    size: {
      xs: "10px",
      sm: "12px",
      base: "13px",
      md: "14px",
      lg: "16px",
      xl: "18px",
      "2xl": "22px",
      "3xl": "28px",
      "4xl": "36px",
      "5xl": "56px",
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1,
      normal: 1.2,
      relaxed: 1.5,
      loose: 1.6,
    },
    family: {
      ui: "var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Spacing scale — margins, padding, gaps
  // ──────────────────────────────────────────────────────────────
  spacing: {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
  },

  // ──────────────────────────────────────────────────────────────
  // Color system
  // ──────────────────────────────────────────────────────────────
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

    // Text color variants for accent backgrounds
    butterText: "#5C4A00",      // text on butter background
    softGreenText: "#2E6010",   // text on soft green background

    // Status/notification colors
    orange: "#F5A623",          // streak dot
    softGreen: "#D4EDBA",       // "Al día" chip background
    errorBg: "#FEE2E2",
    errorText: "#991B1B",
    successBg: "#DCFCE7",
    successText: "#166534",

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

    // Pastel backgrounds for set card icons
    pastel: {
      pink: "#FDDDE6",
      blue: "#C8DFFF",
      green: "#C8EAAA",
      peach: "#FDE8C8",
      purple: "#E8D5F5",
    },

    // Component colors
    progressTrack: "#E0DCD4",
    navPill: "#F0F0F0",
    progressIndent: "#111",
  },

  // ──────────────────────────────────────────────────────────────
  // Border radius — for cards, buttons, inputs
  // ──────────────────────────────────────────────────────────────
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
