import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '@/store';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, Radius, Shadows } from '@/constants/Typography';

interface ThemeColors {
  bg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  card: string;
  header: string;
  tabBar: string;
  inputBg: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  // Brand colors always available
  cream: string;
  blush: string;
  dustyRose: string;
  lavender: string;
  peach: string;
  cocoa: string;
  plum: string;
}

interface ThemeContextValue {
  colors: ThemeColors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
  isDark: boolean;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, accentColor } = useThemeStore();
  const isDark = mode === 'evening';

  const colors: ThemeColors = useMemo(() => {
    if (isDark) {
      return {
        bg: Colors.evening.bg,
        surface: Colors.evening.surface,
        surfaceElevated: Colors.evening.surfaceElevated,
        border: Colors.evening.border,
        text: Colors.evening.text,
        textMuted: Colors.evening.textMuted,
        textSubtle: '#6A5A70',
        accent: accentColor,
        accentLight: Colors.evening.accentLight,
        accentDark: Colors.plum,
        card: Colors.evening.surface,
        header: Colors.evening.bg,
        tabBar: Colors.evening.surface,
        inputBg: Colors.evening.surfaceElevated,
        success: Colors.success,
        error: Colors.error,
        warning: Colors.warning,
        info: Colors.info,
        cream: Colors.evening.bg,
        blush: Colors.evening.surface,
        dustyRose: accentColor,
        lavender: Colors.evening.surfaceElevated,
        peach: Colors.evening.surfaceElevated,
        cocoa: Colors.evening.textMuted,
        plum: Colors.evening.text,
      };
    }
    return {
      bg: Colors.cream,
      surface: Colors.white,
      surfaceElevated: Colors.warmWhite,
      border: Colors.roseLight,
      text: Colors.deepText,
      textMuted: Colors.mutedText,
      textSubtle: Colors.softGray,
      accent: accentColor,
      accentLight: Colors.blush,
      accentDark: Colors.cocoa,
      card: Colors.white,
      header: Colors.cream,
      tabBar: Colors.white,
      inputBg: Colors.cream,
      success: Colors.success,
      error: Colors.error,
      warning: Colors.warning,
      info: Colors.info,
      cream: Colors.cream,
      blush: Colors.blush,
      dustyRose: Colors.dustyRose,
      lavender: Colors.lavender,
      peach: Colors.peach,
      cocoa: Colors.cocoa,
      plum: Colors.plum,
    };
  }, [isDark, accentColor]);

  const value = useMemo(() => ({
    colors,
    typography: Typography,
    spacing: Spacing,
    radius: Radius,
    shadows: Shadows,
    isDark,
    accentColor,
  }), [colors, isDark, accentColor]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
