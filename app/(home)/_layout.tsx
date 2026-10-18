import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { View, Text, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  );
}

export default function HomeLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(35, 33, 32, 0.96)' : 'rgba(255, 255, 255, 0.94)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDark ? '#3B3835' : 'rgba(255, 255, 255, 0.9)',
          height: Platform.OS === 'ios' ? 70 : 64,
          paddingBottom: Platform.OS === 'ios' ? 16 : 8,
          paddingTop: 8,
          marginHorizontal: 18,
          marginBottom: Platform.OS === 'ios' ? 24 : 14,
          borderRadius: 30,
          position: 'absolute',
          shadowColor: '#2B2724',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 6,
        },
        tabBarActiveTintColor: Colors.taupe,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Moments',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Preferences',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
