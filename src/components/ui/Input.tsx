import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input = forwardRef<any, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    ...props
  },
  ref
) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="label" style={[styles.label, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? '#D97B7B' : colors.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
            },
            leftIcon ? { paddingLeft: 0 } : undefined,
            rightIcon ? { paddingRight: 0 } : undefined,
            style,
          ]}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.icon}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {(hint || error) && (
        <Text
          variant="caption"
          style={{ color: error ? '#D97B7B' : colors.textMuted, marginTop: 4 }}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    marginBottom: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
  },
  icon: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
