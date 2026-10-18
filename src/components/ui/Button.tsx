import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  fullWidth = false,
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  const { colors, accentColor } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async (event: Parameters<NonNullable<TouchableOpacityProps['onPress']>>[0]) => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  const bgColor = (() => {
    switch (variant) {
      case 'primary': return accentColor;
      case 'secondary': return colors.blush;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      case 'danger': return '#D97B7B22';
      default: return accentColor;
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return colors.cocoa;
      case 'outline': return accentColor;
      case 'ghost': return colors.text;
      case 'danger': return '#D97B7B';
      default: return '#FFFFFF';
    }
  })();

  const borderColor = variant === 'outline' ? accentColor : 'transparent';
  const padding = size === 'sm' ? { paddingHorizontal: 16, paddingVertical: 10 }
    : size === 'lg' ? { paddingHorizontal: 32, paddingVertical: 18 }
    : { paddingHorizontal: 24, paddingVertical: 14 };

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        animatedStyle,
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        padding,
        fullWidth && { width: '100%' },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={{
              color: textColor,
              fontFamily: 'Inter_600SemiBold',
              fontSize,
              letterSpacing: 0.1,
            }}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 9999,
  },
});
