import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'yours://reset-password',
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSent(true);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={['#FFF8F3', '#E8E1F4']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        {!sent ? (
          <>
            <View style={styles.header}>
              <Text style={{ fontSize: 40 }}>💌</Text>
              <Text style={styles.title}>Reset Password</Text>
              <Text variant="body" style={{ color: Colors.mutedText, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
                Enter your email and we'll send you a secure link to reset your password.
              </Text>
            </View>
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Text>✉️</Text>}
              />
              <Button
                title="Send Reset Link"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleReset}
                style={{ backgroundColor: Colors.dustyRose }}
              />
            </View>
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={{ fontSize: 64, marginBottom: 24 }}>📬</Text>
            <Text style={styles.title}>Check Your Inbox</Text>
            <Text variant="body" style={{ color: Colors.mutedText, textAlign: 'center', lineHeight: 24, marginTop: 12 }}>
              We sent a password reset link to{'\n'}{email}
            </Text>
            <Button
              title="Back to Sign In"
              size="lg"
              onPress={() => router.replace('/(auth)/sign-in')}
              style={{ backgroundColor: Colors.dustyRose, marginTop: 32 }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', padding: 8, marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 36, gap: 8 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: Colors.plum, textAlign: 'center' },
  form: { width: '100%', gap: 16 },
  successContainer: { alignItems: 'center', paddingTop: 60 },
});
