/**
 * Tailwind Config Extension
 * Extends default Tailwind with design system tokens
 * Import this into tailwind.config.ts as needed
 *
 * Usage:
 *   extend: {
 *     ...tailwindExtension.colors,
 *     ...tailwindExtension.typography,
 *     ...tailwindExtension.spacing,
 *   }
 */

export const tailwindExtension = {
  /* ─────────────────────────────────────────────────────────────
     COLORS — Full palette with variants
     ───────────────────────────────────────────────────────────── */
  colors: {
    /* Backgrounds */
    'bg-page': 'var(--color-bg-page)',
    'bg-surface': 'var(--color-bg-surface)',
    'bg-hover': 'var(--color-bg-hover)',
    'bg-subtle': 'var(--color-bg-subtle)',
    'bg-desktop-page': 'var(--color-bg-desktop-page)',

    /* Text/Semantic */
    'text-primary': 'var(--color-text-primary)',
    'text-secondary': 'var(--color-text-secondary)',
    'text-muted': 'var(--color-text-muted)',

    /* Accent Colors */
    sage: 'var(--color-sage)',
    butter: 'var(--color-butter)',
    sky: 'var(--color-sky)',
    rose: 'var(--color-rose)',
    orange: 'var(--color-orange)',

    /* Status Colors */
    'success-bg': 'var(--color-success-bg)',
    'success-text': 'var(--color-success-text)',
    'success-soft': 'var(--color-success-soft)',
    'error-bg': 'var(--color-error-bg)',
    'error-text': 'var(--color-error-text)',
    'warning-text': 'var(--color-warning-text)',

    /* Light Variants */
    'sage-soft': 'var(--color-bg-sage-soft)',
    'sky-light': 'var(--color-bg-sky-light)',
    'rose-soft': 'var(--color-bg-rose-soft)',
    'butter-light': 'var(--color-bg-butter-light)',
    'grey': 'var(--color-bg-grey)',

    /* Pastel (set card backgrounds) */
    'pastel-pink': 'var(--color-pastel-pink)',
    'pastel-blue': 'var(--color-pastel-blue)',
    'pastel-green': 'var(--color-pastel-green)',
    'pastel-peach': 'var(--color-pastel-peach)',
    'pastel-purple': 'var(--color-pastel-purple)',

    /* Interactive */
    'border-default': 'var(--color-border)',
    'nav-pill': 'var(--color-nav-pill)',
    'progress-track': 'var(--color-progress-track)',
  },

  /* ─────────────────────────────────────────────────────────────
     TYPOGRAPHY — Font sizes, weights, leading
     ───────────────────────────────────────────────────────────── */
  fontSize: {
    xs: ['var(--text-xs)', { lineHeight: 'var(--line-height-tight)' }],
    sm: ['var(--text-sm)', { lineHeight: 'var(--line-height-normal)' }],
    base: ['var(--text-base)', { lineHeight: 'var(--line-height-normal)' }],
    md: ['var(--text-md)', { lineHeight: 'var(--line-height-normal)' }],
    lg: ['var(--text-lg)', { lineHeight: 'var(--line-height-normal)' }],
    xl: ['var(--text-xl)', { lineHeight: 'var(--line-height-relaxed)' }],
    '2xl': ['var(--text-2xl)', { lineHeight: 'var(--line-height-relaxed)' }],
    '3xl': ['var(--text-3xl)', { lineHeight: 'var(--line-height-relaxed)' }],
    '4xl': ['var(--text-4xl)', { lineHeight: 'var(--line-height-loose)' }],
    '5xl': ['var(--text-5xl)', { lineHeight: 'var(--line-height-loose)' }],
  },

  fontWeight: {
    regular: 'var(--font-weight-regular)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },

  lineHeight: {
    tight: 'var(--line-height-tight)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',
  },

  fontFamily: {
    ui: 'var(--font-ui)',
    card: 'var(--font-card)',
  },

  /* ─────────────────────────────────────────────────────────────
     SPACING — Margin, padding, gap scale
     ───────────────────────────────────────────────────────────── */
  spacing: {
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    5: 'var(--spacing-5)',
    6: 'var(--spacing-6)',
    8: 'var(--spacing-8)',
    10: 'var(--spacing-10)',
    12: 'var(--spacing-12)',
  },

  /* ─────────────────────────────────────────────────────────────
     BORDER RADIUS — Curves
     ───────────────────────────────────────────────────────────── */
  borderRadius: {
    xs: 'var(--radius-xs)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    full: 'var(--radius-full)',
  },

  /* ─────────────────────────────────────────────────────────────
     SHADOWS — Depth layers
     ───────────────────────────────────────────────────────────── */
  boxShadow: {
    none: 'var(--shadow-none)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },

  /* ─────────────────────────────────────────────────────────────
     BORDERS — Stroke styles
     ───────────────────────────────────────────────────────────── */
  borderWidth: {
    DEFAULT: 'var(--border-width)',
    2: 'var(--border-width-2)',
    3: 'var(--border-width-3)',
  },

  borderColor: {
    DEFAULT: 'var(--color-border)',
  },

  /* ─────────────────────────────────────────────────────────────
     TRANSITIONS — Timing functions
     ───────────────────────────────────────────────────────────── */
  transitionDuration: {
    fast: 'var(--transition-fast)',
    normal: 'var(--transition-normal)',
    slow: 'var(--transition-slow)',
  },
} as const;

/**
 * Component Presets
 * Pre-composed combinations for common components
 */
export const componentPresets = {
  card: {
    container: 'rounded-lg border border-border-default bg-surface shadow-sm',
    padding: 'p-4',
    interactive: 'transition-all duration-normal hover:shadow-md active:scale-98',
  },

  button: {
    base: 'inline-flex items-center justify-center rounded-sm font-semibold transition-colors duration-fast',
    variants: {
      primary: 'bg-text-primary text-surface hover:opacity-90 active:opacity-80',
      secondary: 'bg-sage text-text-primary hover:opacity-90 active:opacity-80',
      outline: 'border border-border-default bg-surface text-text-primary hover:bg-bg-hover',
      ghost: 'bg-transparent text-text-primary hover:bg-bg-hover',
    },
    sizes: {
      sm: 'px-3 py-1.5 text-xs font-medium',
      md: 'px-4 py-2 text-sm font-medium',
      lg: 'px-6 py-3 text-base font-medium',
      icon: 'h-9 w-9 p-0',
    },
  },

  badge: {
    base: 'inline-flex items-center rounded-xs px-2 py-1 text-xs font-semibold',
    variants: {
      default: 'bg-text-primary text-surface',
      secondary: 'bg-bg-subtle text-text-primary',
      success: 'bg-success-soft text-success-text',
      warning: 'bg-butter-light text-warning-text',
      destructive: 'bg-error-bg text-error-text',
    },
  },

  input: {
    base: 'w-full rounded-md border border-border-default bg-surface px-4 py-3 text-base text-text-primary placeholder-text-muted',
    focus: 'focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2',
  },
} as const;
