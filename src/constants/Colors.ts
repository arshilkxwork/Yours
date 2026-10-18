// Yours / Aura Design System — Japandi Warm Stone & Glassmorphic Palette
export const Colors = {
  // Primary minimalist canvas & clay tones (from reference design)
  bgLinen: '#ECE8E1',
  bgSoft: '#F3EFEA',
  cardGlass: 'rgba(255, 255, 255, 0.72)',
  cardGlassBorder: 'rgba(255, 255, 255, 0.85)',
  surfaceSolid: '#FAF8F5',
  surfaceSubtle: '#E5E1D8',

  // Organic accent tones
  taupe: '#94877A',
  taupeDark: '#6E6256',
  taupeLight: '#C7BCB0',
  sand: '#D9D0C5',
  sage: '#7C8E79',
  sageLight: '#D2DDD0',
  sageDark: '#4F614C',

  // Legacy compat aliases with warm aesthetic tuning
  cream: '#ECE8E1',
  blush: '#E5E0D8',
  dustyRose: '#94877A',
  lavender: '#E2DFD8',
  peach: '#EFECE6',
  cocoa: '#6E6256',
  plum: '#383430',

  roseLight: '#F3EFEA',
  roseMid: '#D9D0C5',
  roseDark: '#94877A',
  amethyst: '#7C8E79',
  amethystLight: '#D2DDD0',
  warmWhite: '#FCFAF7',
  softGray: '#ABA59E',
  mutedText: '#857F79',
  deepText: '#2B2724',

  // Semantic
  success: '#7C8E79',
  warning: '#C9A96E',
  error: '#BA6D68',
  info: '#7E919E',

  // Evening (dark stone) theme overrides
  evening: {
    bg: '#181716',
    surface: '#232120',
    surfaceElevated: '#2E2B29',
    border: '#3B3835',
    text: '#EFECE6',
    textMuted: '#9E9892',
    accent: '#B5A89B',
    accentLight: '#4A443E',
  },

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Gradients = {
  linen: ['#ECE8E1', '#F3EFEA', '#ECE8E1'],
  sand: ['#F3EFEA', '#ECE8E1', '#E5E0D8'],
  sage: ['#D2DDD0', '#ECE8E1', '#F3EFEA'],
  evening: ['#181716', '#232120', '#2E2B29'],
  sunrise: ['#ECE8E1', '#F3EFEA', '#E5E0D8'],
  blush: ['#ECE8E1', '#E5E0D8', '#F3EFEA'],
  plum: ['#2B2724', '#383430', '#4A443E'],
  rose: ['#F3EFEA', '#ECE8E1', '#E5E0D8'],
  warmGold: ['#F3EFEA', '#EAE3D8', '#DDD5C7'],
} as const;
