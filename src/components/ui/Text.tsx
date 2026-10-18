import React from 'react';
import {
  Text as RNText,
  TextProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Variant =
  | 'display'      // DM Serif, large
  | 'heading'      // DM Serif, medium
  | 'subheading'   // Inter SemiBold
  | 'body'         // Inter Regular
  | 'bodyMedium'   // Inter Medium
  | 'caption'      // Inter Regular, small
  | 'label'        // Inter SemiBold, small
  | 'overline';    // Inter, wide tracking, uppercase

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
}

export function Text({
  variant = 'body',
  color,
  align,
  opacity,
  style,
  ...props
}: ThemedTextProps) {
  const { colors, typography } = useTheme();

  const variantStyle = styles[variant];
  const resolvedColor = color ?? colors.text;

  return (
    <RNText
      style={[
        variantStyle,
        { color: resolvedColor },
        align ? { textAlign: align } : undefined,
        opacity !== undefined ? { opacity } : undefined,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  overline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
