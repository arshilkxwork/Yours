import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/Colors';
import { AuthService, isLiveSupabaseConfigured } from '@/lib/authService';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('nayda@aura.journal');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await AuthService.signIn(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials.');
      } else {
        router.replace('/(home)');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMsg(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <View style={styles.backgroundLayer} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.dbBadge}>
            <View
              style={[
                styles.dbDot,
                { backgroundColor: isLiveSupabaseConfigured() ? '#7C8E79' : '#8A9E88' },
              ]}
            />
            <Text style={styles.dbText}>
              {isLiveSupabaseConfigured() ? 'Cloud DB Live' : 'Database Ready'}
            </Text>
          </View>
        </View>

        {/* Brand & Title */}
        <View style={styles.brandContainer}>
          <View style={styles.sealCircle}>
            <Text style={styles.sealGlyph}>✦</Text>
          </View>
          <Text style={styles.title}>AURA JOURNAL</Text>
          <Text style={styles.subtitle}>
            Sign in to unlock your private space, daily focus sessions, and personal notes.
          </Text>
        </View>

        {/* Error notice if any */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ACCOUNT EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldIcon}>✉️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="name@aura.journal"
                placeholderTextColor={Colors.mutedText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMsg(null);
                }}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotLink}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.mutedText}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMsg(null);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Primary Action */}
          <TouchableOpacity
            style={[styles.signInButton, loading && { opacity: 0.7 }]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In to Journal</Text>
            )}
          </TouchableOpacity>

          {/* Quick Real User Test Fillers */}
          <View style={styles.quickFillContainer}>
            <Text style={styles.quickFillTitle}>Quick Tap Fill:</Text>
            <View style={styles.quickChipsRow}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => fillQuickAccount('nayda@aura.journal', 'password123')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>Nayda (Primary)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => fillQuickAccount('sophia@whisper.love', 'password123')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>Sophia (Partner)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Need a new private account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.securityFootnote}>
          🛡️ Zero-Knowledge Local & Cloud Sync with End-to-End Encryption
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#ECE8E1',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ECE8E1',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  backArrow: {
    fontSize: 20,
    color: '#242220',
  },
  dbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  dbDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dbText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#7C8E79',
    letterSpacing: 0.3,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  sealCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#242220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  sealGlyph: {
    fontSize: 22,
    color: '#7C8E79',
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: '#242220',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6E6760',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(217, 83, 79, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.3)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#C0392B',
    lineHeight: 18,
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#242220',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#94877A',
    letterSpacing: 1.2,
  },
  forgotLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#7C8E79',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 14,
    height: 52,
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#242220',
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  signInButton: {
    backgroundColor: '#7C8E79',
    borderRadius: 20,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#7C8E79',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  signInButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  quickFillContainer: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  quickFillTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#94877A',
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    backgroundColor: '#F3EFEA',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  quickChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#4A4642',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
  },
  footerPrompt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6E6760',
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#7C8E79',
  },
  securityFootnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#94877A',
    marginTop: 20,
    textAlign: 'center',
  },
});
