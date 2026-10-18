import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async () => {
    setErrorMsg(null);
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.signUp(email, password, displayName);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      } else {
        router.replace('/(home)');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.dbText}>Database Online</Text>
          </View>
        </View>

        {/* Brand & Title */}
        <View style={styles.brandContainer}>
          <View style={styles.sealCircle}>
            <Text style={styles.sealGlyph}>🌿</Text>
          </View>
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          <Text style={styles.subtitle}>
            Begin your personal journey with secure local storage and private synchronization.
          </Text>
        </View>

        {/* Error notification */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Display Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>YOUR NAME / MONIKER</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldIcon}>👤</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nayda"
                placeholderTextColor={Colors.mutedText}
                autoCapitalize="words"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  setErrorMsg(null);
                }}
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldIcon}>✉️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="you@domain.com"
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

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD (MIN 6 CHARACTERS)</Text>
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

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.mutedText}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMsg(null);
                }}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.signUpButton, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signUpButtonText}>Register Private Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.securityFootnote}>
          🔒 Your credentials and private data remain locally encrypted on your device.
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
    marginBottom: 24,
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
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
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
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#94877A',
    letterSpacing: 1.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 14,
    height: 50,
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
  signUpButton: {
    backgroundColor: '#7C8E79',
    borderRadius: 20,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#7C8E79',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  signUpButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
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
    marginTop: 18,
    textAlign: 'center',
  },
});
