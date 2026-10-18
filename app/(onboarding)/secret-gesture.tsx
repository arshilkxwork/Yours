import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Storage } from '@/lib/storage';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';

const PIN_LENGTH = 4;

function PinDot({ filled }: { filled: boolean }) {
  return (
    <View
      style={[
        styles.pinDot,
        { backgroundColor: filled ? Colors.dustyRose : Colors.roseLight, borderColor: Colors.roseMid },
      ]}
    />
  );
}

export default function SecretGestureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'explain' | 'set' | 'confirm'>('explain');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [loading, setLoading] = useState(false);

  const currentPin = step === 'confirm' ? confirmPin : pin;

  const handleKeyPress = (key: string) => {
    if (step === 'explain') return;
    const current = step === 'set' ? pin : confirmPin;
    const setter = step === 'set' ? setPin : setConfirmPin;
    if (key === '⌫') {
      setter(current.slice(0, -1));
      return;
    }
    if (current.length >= PIN_LENGTH) return;
    const next = current + key;
    setter(next);

    if (next.length === PIN_LENGTH) {
      if (step === 'set') {
        setFirstPin(next);
        setTimeout(() => setStep('confirm'), 300);
      } else {
        // Confirm step
        if (next === firstPin) {
          savePinAndFinish(next);
        } else {
          Alert.alert('PINs Don\'t Match', 'Please try again.', [
            {
              text: 'Retry',
              onPress: () => {
                setPin('');
                setConfirmPin('');
                setFirstPin('');
                setStep('set');
              },
            },
          ]);
        }
      }
    }
  };

  const savePinAndFinish = async (finalPin: string) => {
    setLoading(true);
    try {
      // Store a hashed version of the PIN using SecureStore
      // In production, use a proper PBKDF2/bcrypt hash
      const pinHash = btoa(finalPin + 'whisper-salt-v1');
      await Storage.setItem('whisper_pin_hash', pinHash);
      await Storage.setItem('whisper_chat_access_method', 'triple_tap_pin');
      setTimeout(() => router.replace('/(home)'), 300);
    } catch {
      Alert.alert('Error', 'Could not save your PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const numpad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <LinearGradient colors={['#FFF8F3', '#E8E1F4']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.steps}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[styles.step, { backgroundColor: Colors.roseMid }, i === 4 && { backgroundColor: Colors.dustyRose, width: 40 }]} />
          ))}
        </View>

        {step === 'explain' && (
          <View style={styles.section}>
            <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>🤫</Text>
            <Text style={styles.title}>Your Secret Access</Text>
            <Text variant="body" align="center" style={{ color: Colors.mutedText, marginTop: 12, lineHeight: 24 }}>
              To access your private messages, you'll{'\n'}
              <Text variant="bodyMedium" style={{ color: Colors.cocoa }}>triple-tap the flower</Text> on the home screen,{'\n'}
              then enter a 4-digit PIN that only you know.
            </Text>

            <View style={styles.tipBox}>
              <Text variant="label" style={{ color: Colors.cocoa, marginBottom: 8 }}>How it works:</Text>
              <Text variant="body" style={{ color: Colors.mutedText, lineHeight: 22 }}>
                1. The home screen looks like a lifestyle app.{'\n'}
                2. Triple-tap the 🌸 to open a PIN prompt.{'\n'}
                3. Enter your PIN to reveal the chat.{'\n'}
                4. Exit chat to return to the home screen.
              </Text>
            </View>

            <View style={[styles.tipBox, { backgroundColor: Colors.lavender + '40' }]}>
              <Text variant="caption" style={{ color: Colors.mutedText, lineHeight: 20 }}>
                ⚠️  The PIN is a privacy layer — not a substitute for strong account security. Both users should keep their login credentials safe.
              </Text>
            </View>

            <Button
              title="Set My PIN →"
              size="lg"
              fullWidth
              onPress={() => setStep('set')}
              style={{ backgroundColor: Colors.dustyRose, marginTop: 8 }}
            />
            <Button
              title="Skip for now"
              variant="ghost"
              size="sm"
              onPress={() => router.replace('/(home)')}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        {(step === 'set' || step === 'confirm') && (
          <View style={styles.section}>
            <Text style={styles.title}>
              {step === 'set' ? 'Set Your PIN' : 'Confirm Your PIN'}
            </Text>
            <Text variant="body" align="center" style={{ color: Colors.mutedText, marginTop: 8 }}>
              {step === 'set' ? 'Enter a 4-digit PIN.' : 'Enter the same PIN again.'}
            </Text>

            {/* PIN dots */}
            <View style={styles.pinDots}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <PinDot key={i} filled={i < currentPin.length} />
              ))}
            </View>

            {/* Numpad */}
            <View style={styles.numpad}>
              {numpad.map((row, ri) => (
                <View key={ri} style={styles.numpadRow}>
                  {row.map((key, ki) => (
                    <TouchableOpacity
                      key={ki}
                      onPress={() => key && handleKeyPress(key)}
                      style={[styles.numpadKey, !key && { opacity: 0 }]}
                      activeOpacity={key ? 0.7 : 1}
                    >
                      <Text style={[
                        styles.numpadText,
                        key === '⌫' && { fontSize: 20 },
                      ]}>
                        {key}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  step: { width: 24, height: 4, borderRadius: 2 },
  section: { width: '100%', alignItems: 'center', gap: 16 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: Colors.plum, textAlign: 'center' },
  tipBox: {
    width: '100%', backgroundColor: Colors.blush + '60',
    borderRadius: 16, padding: 16,
  },
  pinDots: { flexDirection: 'row', gap: 20, marginVertical: 32 },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  numpad: { width: '80%', gap: 8 },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-between' },
  numpadKey: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF80', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.roseMid,
  },
  numpadText: { fontFamily: 'Inter_500Medium', fontSize: 24, color: Colors.plum },
});
