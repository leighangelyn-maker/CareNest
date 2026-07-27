// ─── Design tokens (mirrors CSS variables in the web prototype) ───────────────

export const Colors = {
  navy: '#0B1F3A',
  navyLight: '#152C52',
  navyPale: '#EDF1F7',
  gold: '#C9A227',
  goldLight: '#E8CD6B',
  cream: '#F6F1E4',
  paper: '#FFFDF8',
  ink: '#1C2431',
  slate: '#5B6B82',
  slateSoft: '#8B97A8',
  line: 'rgba(11,31,58,0.13)',
  success: '#2F6B4F',
  successBg: '#E6F0EA',
  danger: '#B5462F',
} as const;

export const Fonts = {
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  spaceMono: 'SpaceMono_400Regular',
  spaceMonoBold: 'SpaceMono_700Bold',
} as const;

// ─── Layout constants ─────────────────────────────────────────────────────────

/** Horizontal padding applied uniformly to all screens (dp) */
export const SCREEN_H_PADDING = 20;

/** Height of the bottom tab bar (dp) — used for scroll-list bottom padding */
export const TAB_BAR_HEIGHT = 60;

// ─── Typography scale ─────────────────────────────────────────────────────────
// Line-height rules:
//   • Body text  → 1.5× font size  (Req 13.8)
//   • Headings   → 1.2× font size  (Req 13.8)

export const Typography = {
  /** Screen-level heading — 26 sp / lh 32 (≈1.23×), Inter Bold */
  screenTitle: { fontSize: 26, lineHeight: 32, fontFamily: Fonts.interBold },

  /** Section heading — 18 sp / lh 22 (≈1.22×), Inter Bold */
  sectionHeading: { fontSize: 18, lineHeight: 22, fontFamily: Fonts.interBold },

  /** Primary body text — 14 sp / lh 21 (1.5×), Inter Regular */
  body: { fontSize: 14, lineHeight: 21, fontFamily: Fonts.inter },

  /** Secondary body text — 13 sp / lh 19 (≈1.46×), Inter Regular */
  bodySmall: { fontSize: 13, lineHeight: 19, fontFamily: Fonts.inter },

  /** UI label — 12 sp / lh 16 (≈1.33×), Inter SemiBold */
  label: { fontSize: 12, lineHeight: 16, fontFamily: Fonts.interSemiBold },

  /** Small UI label — 11 sp / lh 15 (≈1.36×), Inter SemiBold */
  labelSmall: { fontSize: 11, lineHeight: 15, fontFamily: Fonts.interSemiBold },

  /** Eyebrow / category tag — 10 sp / lh 14 (1.4×), SpaceMono Bold */
  eyebrow: { fontSize: 10, lineHeight: 14, fontFamily: Fonts.spaceMonoBold },

  /** Monospaced metadata (refs, rates) — 12 sp / lh 18 (1.5×), SpaceMono Bold */
  meta: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.spaceMonoBold },

  /** Button label — 15 sp / lh 18 (1.2×), Inter SemiBold */
  btnLabel: { fontSize: 15, lineHeight: 18, fontFamily: Fonts.interSemiBold },
} as const;
