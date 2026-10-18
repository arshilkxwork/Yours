import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function ChatLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="conversation" />
      <Stack.Screen name="voice-call" />
      <Stack.Screen name="video-call" />
    </Stack>
  );
}
