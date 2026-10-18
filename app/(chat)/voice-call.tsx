import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useProfileStore } from '@/store';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/Colors';

// Pulsing ring animation for ringing state
function PulseRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.quad) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1200 }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: color,
    transform: [{ scale: scale.value }], opacity: opacity.value,
  }));
  return <Animated.View style={style} />;
}

type CallState = 'ringing' | 'connecting' | 'connected' | 'ended';

export default function VoiceCallScreen() {
  const { colors, accentColor, isDark } = useTheme();
  const { partnerProfile } = useProfileStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [callState, setCallState] = useState<CallState>('ringing');
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Simulate call connecting after 3s (in production, this uses Daily.co or WebRTC)
    const ringingTimer = setTimeout(() => {
      setCallState('connecting');
      setTimeout(() => {
        setCallState('connected');
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500);
    }, 3000);

    return () => {
      clearTimeout(ringingTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const hangUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => router.back(), 1000);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const statusText = {
    ringing: 'Ringing...',
    connecting: 'Connecting...',
    connected: formatDuration(duration),
    ended: 'Call Ended',
  }[callState];

  return (
    <LinearGradient
      colors={isDark ? ['#1C1420', '#2A1F2D', '#493443'] : ['#493443', '#65515A', '#D9A3B4']}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        {/* Partner info */}
        <View style={styles.partnerArea}>
          <View style={styles.avatarOuter}>
            {callState === 'ringing' && <PulseRing color={Colors.dustyRose} />}
            {callState === 'ringing' && <PulseRing color={Colors.dustyRose} />}
            <View style={styles.avatarInner}>
              <Text style={{ fontSize: 48 }}>🌸</Text>
            </View>
          </View>
          <Text style={styles.partnerName}>{partnerProfile?.display_name ?? 'Your Partner'}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {callState === 'connected' && (
            <TouchableOpacity
              onPress={() => setSpeaker(!speaker)}
              style={[styles.controlBtn, speaker && { backgroundColor: '#FFFFFF30' }]}
            >
              <Text style={{ fontSize: 28 }}>{speaker ? '🔊' : '🔈'}</Text>
              <Text variant="caption" style={{ color: '#FFFFFF80', marginTop: 4 }}>Speaker</Text>
            </TouchableOpacity>
          )}

          {/* Hang up */}
          <TouchableOpacity onPress={hangUp} style={styles.hangUpBtn}>
            <Text style={{ fontSize: 28 }}>📵</Text>
          </TouchableOpacity>

          {callState === 'connected' && (
            <TouchableOpacity
              onPress={() => setMuted(!muted)}
              style={[styles.controlBtn, muted && { backgroundColor: '#FFFFFF30' }]}
            >
              <Text style={{ fontSize: 28 }}>{muted ? '🔇' : '🎙️'}</Text>
              <Text variant="caption" style={{ color: '#FFFFFF80', marginTop: 4 }}>
                {muted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daily.co notice */}
        <View style={styles.notice}>
          <Text variant="caption" align="center" style={{ color: '#FFFFFF50', lineHeight: 18 }}>
            Voice calls use Daily.co WebRTC infrastructure.{'\n'}
            Configure EXPO_PUBLIC_DAILY_DOMAIN and DAILY_API_KEY to enable real calls.{'\n'}
            Currently showing call UI with simulated state.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 },
  partnerArea: { alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' },
  avatarOuter: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarInner: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#FFFFFF20', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFFFFF40',
  },
  partnerName: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: '#FFFFFF' },
  status: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#FFFFFF80' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 32 },
  controlBtn: { alignItems: 'center', padding: 16, borderRadius: 20 },
  hangUpBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#D97B7B',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D97B7B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  notice: { paddingHorizontal: 24 },
});
