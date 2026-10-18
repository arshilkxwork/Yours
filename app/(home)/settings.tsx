import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Storage } from '@/lib/storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore, useProfileStore, useThemeStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { AuthService, isLiveSupabaseConfigured } from '@/lib/authService';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { SecretTutorialModal } from '@/components/SecretTutorialModal';

const ACCENT_COLORS = [
  '#94877A', '#7C8E79', '#B5A89B', '#6E6256', '#8FA08C', '#ABA59E',
];

function SettingRow({
  label,
  emoji,
  onPress,
  right,
  subtitle,
}: {
  label: string;
  emoji: string;
  onPress?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '500' }}>{label}</Text>
        {subtitle && <Text variant="caption" style={{ color: colors.textMuted }}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Text style={{ color: colors.textSubtle, fontSize: 16 }}>›</Text>)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { mode, accentColor, setMode, setAccentColor } = useThemeStore();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [dailyReminders, setDailyReminders] = useState(true);
  const [ambientSounds, setAmbientSounds] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [hapticTouch, setHapticTouch] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your journal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AuthService.signOut();
            await Storage.removeItem('whisper_pin_hash');
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const changePasscode = () => router.push('/(onboarding)/secret-gesture');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="caption" style={{ color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            PREFERENCES
          </Text>
          <Text variant="heading" style={{ color: colors.text, fontSize: 28, marginTop: 2 }}>
            Settings
          </Text>
        </View>

        {/* Profile / Journal Member Card */}
        <Card elevated style={[styles.profileCard, { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB8' }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarCircle, { borderColor: Colors.taupe }]}>
              <Text style={{ fontSize: 26 }}>🌿</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="subheading" style={{ color: colors.text, fontWeight: '600' }}>
                {profile?.display_name ?? 'Sophia'}
              </Text>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                Aura Mindful Journal • Pro Member
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: Colors.sageLight + '60' }]}>
              <Text variant="caption" style={{ color: Colors.sageDark, fontWeight: '600', fontSize: 11 }}>Active</Text>
            </View>
          </View>
        </Card>

        {/* Aesthetics & Theme */}
        <View style={styles.section}>
          <Text variant="overline" style={[styles.sectionLabel, { color: colors.textMuted }]}>Aesthetics & Theme</Text>
          <Card padded={false} style={[styles.settingsCard, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFFCC' }]}>
            <SettingRow
              label="Appearance Mode"
              subtitle={isDark ? 'Midnight Slate' : 'Warm Linen'}
              emoji={isDark ? '🌙' : '☀️'}
              onPress={() => setMode(isDark ? 'light' : 'evening')}
              right={
                <Text variant="caption" style={{ color: Colors.taupe, fontWeight: '600' }}>
                  {isDark ? 'Dark' : 'Light'}
                </Text>
              }
            />
            <View style={[styles.paletteRow, { borderBottomColor: colors.border }]}>
              <Text variant="bodyMedium" style={{ color: colors.text, fontSize: 14 }}>Accent Tone</Text>
              <View style={styles.colorDots}>
                {ACCENT_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setAccentColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      accentColor === c && [styles.selectedColorDot, { borderColor: colors.text }],
                    ]}
                  />
                ))}
              </View>
            </View>
            <SettingRow
              label="Haptic Sensations"
              subtitle="Tactile feedback on subtle touches"
              emoji="📳"
              right={
                <Switch
                  value={hapticTouch}
                  onValueChange={setHapticTouch}
                  trackColor={{ false: colors.border, true: Colors.taupe }}
                />
              }
            />
          </Card>
        </View>

        {/* Mindfulness & Habits */}
        <View style={styles.section}>
          <Text variant="overline" style={[styles.sectionLabel, { color: colors.textMuted }]}>Habits & Daily Flow</Text>
          <Card padded={false} style={[styles.settingsCard, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFFCC' }]}>
            <SettingRow
              label="Daily Reflection Prompt"
              subtitle="Remind at 08:30 AM every morning"
              emoji="✍️"
              right={
                <Switch
                  value={dailyReminders}
                  onValueChange={setDailyReminders}
                  trackColor={{ false: colors.border, true: Colors.taupe }}
                />
              }
            />
            <SettingRow
              label="Hydration Reminders"
              subtitle="Periodic mindful water checkpoints"
              emoji="💧"
              right={
                <Switch
                  value={waterReminders}
                  onValueChange={setWaterReminders}
                  trackColor={{ false: colors.border, true: Colors.taupe }}
                />
              }
            />
            <SettingRow
              label="Ambient Lo-Fi Audio"
              subtitle="Soft focus soundscapes during sessions"
              emoji="🎧"
              right={
                <Switch
                  value={ambientSounds}
                  onValueChange={setAmbientSounds}
                  trackColor={{ false: colors.border, true: Colors.taupe }}
                />
              }
            />
          </Card>
        </View>

        {/* Security & Data */}
        <View style={styles.section}>
          <Text variant="overline" style={[styles.sectionLabel, { color: colors.textMuted }]}>Privacy & Passcode</Text>
          <Card padded={false} style={[styles.settingsCard, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFFCC' }]}>
            <SettingRow
              label="Journal Passcode"
              subtitle="4-digit personal security PIN"
              emoji="🔒"
              onPress={changePasscode}
            />
            <SettingRow
              label="Vault Access Tutorial"
              subtitle="Interactive guide to finding hidden chats"
              emoji="🗝️"
              onPress={() => setShowTutorial(true)}
            />
            <SettingRow
              label="Database Engine"
              subtitle={isLiveSupabaseConfigured() ? 'Cloud Supabase Connected' : 'Local Encrypted SQLite / Storage'}
              emoji="🗄️"
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.sage }} />
                  <Text variant="caption" style={{ color: Colors.sage, fontWeight: '600' }}>Active</Text>
                </View>
              }
            />
            <SettingRow
              label="Cloud Backup"
              subtitle="Encrypted journal reflections & habits"
              emoji="☁️"
              right={<Text variant="caption" style={{ color: Colors.sage, fontWeight: '600' }}>Synced</Text>}
            />
            <SettingRow
              label="Export Journal Data"
              subtitle="Download your reflections as PDF / Markdown"
              emoji="📑"
              onPress={() => Alert.alert('Export', 'Your reflections have been compiled and saved.')}
            />
          </Card>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Card padded={false} style={[styles.settingsCard, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFFCC' }]}>
            <SettingRow
              label="Sign Out"
              emoji="🚪"
              onPress={handleSignOut}
              right={<Text style={{ color: Colors.error, fontSize: 14 }}>Sign Out</Text>}
            />
          </Card>
        </View>

        <Text variant="caption" style={[styles.versionText, { color: colors.textMuted }]}>
          Aura Minimalist Journal • Version 2.4.0 (Build 118)
        </Text>
      </ScrollView>

      <SecretTutorialModal
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { marginBottom: 2 },
  profileCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  section: { gap: 8 },
  sectionLabel: {
    paddingHorizontal: 4,
    letterSpacing: 1.2,
  },
  settingsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colorDots: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectedColorDot: {
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  versionText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 11,
  },
});
