import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useThemeStore } from '@/store';

const THEMES = [
  {
    id: 'light',
    name: 'Morning Bloom',
    description: 'Warm cream and soft blush for daytime.',
    preview: ['#FFF8F3', '#F9E3D5', '#F4DCE5'],
    emoji: '🌸',
  },
  {
    id: 'evening',
    name: 'Evening Dusk',
    description: 'Deep plum and muted lavender for nighttime.',
    preview: ['#1C1420', '#2A1F2D', '#493443'],
    emoji: '🌙',
  },
];

const ACCENTS = [
  { color: '#D9A3B4', name: 'Dusty Rose' },
  { color: '#C07A9A', name: 'Deep Rose' },
  { color: '#9B8EC4', name: 'Amethyst' },
  { color: '#7DBF9A', name: 'Sage' },
  { color: '#E8C56D', name: 'Gold' },
  { color: '#7BA8D9', name: 'Periwinkle' },
  { color: '#D97B7B', name: 'Coral' },
  { color: '#C4A882', name: 'Warm Sand' },
];

export default function ThemePickScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, accentColor, setMode, setAccentColor } = useThemeStore();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'evening'>(mode);
  const [selectedAccent, setSelectedAccent] = useState(accentColor);

  const handleContinue = () => {
    setMode(selectedTheme);
    setAccentColor(selectedAccent);
    router.push('/(onboarding)/partner-invite');
  };

  return (
    <LinearGradient
      colors={selectedTheme === 'light' ? ['#FFF8F3', '#F4DCE5'] : ['#1C1420', '#2A1F2D']}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.steps}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[
              styles.step,
              { backgroundColor: selectedTheme === 'light' ? Colors.roseMid : Colors.evening.border },
              i === 2 && { backgroundColor: selectedAccent, width: 40 },
            ]} />
          ))}
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: selectedTheme === 'light' ? Colors.plum : Colors.evening.text }]}>
            Choose Your Mood
          </Text>
          <Text variant="body" style={{ color: selectedTheme === 'light' ? Colors.mutedText : Colors.evening.textMuted, textAlign: 'center', marginTop: 8 }}>
            You can change this anytime in Settings.
          </Text>
        </View>

        {/* Theme cards */}
        <View style={styles.themeRow}>
          {THEMES.map(theme => {
            const isSelected = selectedTheme === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setSelectedTheme(theme.id as 'light' | 'evening')}
                style={[
                  styles.themeCard,
                  isSelected && { borderColor: selectedAccent, borderWidth: 2.5 },
                ]}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={theme.preview as [string, string, string]}
                  style={styles.themePreview}
                >
                  <Text style={{ fontSize: 32 }}>{theme.emoji}</Text>
                </LinearGradient>
                <View style={{ padding: 12, gap: 2 }}>
                  <Text
                    variant="label"
                    style={{ color: selectedTheme === 'light' ? Colors.plum : Colors.evening.text }}
                  >
                    {theme.name}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: selectedTheme === 'light' ? Colors.mutedText : Colors.evening.textMuted }}
                  >
                    {theme.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: selectedAccent }]}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Accent color picker */}
        <View style={styles.section}>
          <Text
            variant="label"
            style={{ color: selectedTheme === 'light' ? Colors.cocoa : Colors.evening.textMuted, marginBottom: 12 }}
          >
            Accent Color
          </Text>
          <View style={styles.accentGrid}>
            {ACCENTS.map(accent => (
              <TouchableOpacity
                key={accent.color}
                onPress={() => setSelectedAccent(accent.color)}
                style={[
                  styles.accentDot,
                  { backgroundColor: accent.color },
                  selectedAccent === accent.color && styles.accentSelected,
                ]}
                activeOpacity={0.8}
              >
                {selectedAccent === accent.color && (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Continue"
          size="lg"
          fullWidth
          onPress={handleContinue}
          style={{ backgroundColor: selectedAccent, marginTop: 12 }}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step: { width: 24, height: 4, borderRadius: 2 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, textAlign: 'center' },
  themeRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 24 },
  themeCard: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#FFFFFF20', borderWidth: 1.5, borderColor: 'transparent',
  },
  themePreview: { height: 100, alignItems: 'center', justifyContent: 'center' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  section: { width: '100%', marginBottom: 24 },
  accentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  accentDot: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  accentSelected: {
    borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
});
