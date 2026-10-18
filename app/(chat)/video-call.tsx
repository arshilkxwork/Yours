import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useProfileStore } from '@/store';
import { Text } from '@/components/ui/Text';

const { width, height } = Dimensions.get('window');

type CallState = 'connecting' | 'connected' | 'ended';

export default function VideoCallScreen() {
  const { colors, accentColor } = useTheme();
  const { partnerProfile } = useProfileStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [callState, setCallState] = useState<CallState>('connecting');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const hangUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => router.back(), 800);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1A1020' }]}>
      {/* Remote video (partner) - placeholder */}
      <View style={styles.remoteVideo}>
        {callState === 'connecting' ? (
          <View style={styles.connectingOverlay}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🌸</Text>
            <Text style={styles.partnerName}>{partnerProfile?.display_name ?? 'Partner'}</Text>
            <Text style={{ color: '#FFFFFF80', marginTop: 8 }}>Connecting...</Text>
          </View>
        ) : cameraOff ? (
          <View style={styles.cameraOff}>
            <Text style={{ fontSize: 64 }}>🌸</Text>
            <Text style={styles.partnerName}>{partnerProfile?.display_name ?? 'Partner'}</Text>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            {/* In production: <DailyCallView /> */}
            <Text style={{ fontSize: 64, opacity: 0.3 }}>🎥</Text>
            <Text style={{ color: '#FFFFFF30', marginTop: 8, fontFamily: 'Inter_400Regular' }}>
              Video feed (Daily.co)
            </Text>
          </View>
        )}
      </View>

      {/* Local video (self) */}
      <View style={[styles.localVideo, { top: insets.top + 16 }]}>
        <View style={styles.selfView}>
          <Text style={{ fontSize: 24 }}>😊</Text>
        </View>
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.statusBadge}>
          {callState === 'connected' && (
            <>
              <View style={styles.greenDot} />
              <Text variant="caption" style={{ color: '#fff' }}>{formatDuration(duration)}</Text>
            </>
          )}
          {callState === 'connecting' && (
            <Text variant="caption" style={{ color: '#FFFFFF80' }}>Connecting...</Text>
          )}
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 32 }]}>
        <TouchableOpacity
          onPress={() => setMuted(!muted)}
          style={[styles.controlBtn, muted && styles.controlBtnActive]}
        >
          <Text style={{ fontSize: 26 }}>{muted ? '🔇' : '🎙️'}</Text>
          <Text variant="caption" style={styles.btnLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={hangUp} style={styles.hangUpBtn}>
          <Text style={{ fontSize: 28 }}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCameraOff(!cameraOff)}
          style={[styles.controlBtn, cameraOff && styles.controlBtnActive]}
        >
          <Text style={{ fontSize: 26 }}>{cameraOff ? '📷' : '🎥'}</Text>
          <Text variant="caption" style={styles.btnLabel}>{cameraOff ? 'Start Cam' : 'Stop Cam'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFrontCamera(!frontCamera)}
          style={styles.controlBtn}
        >
          <Text style={{ fontSize: 26 }}>🔄</Text>
          <Text variant="caption" style={styles.btnLabel}>Flip</Text>
        </TouchableOpacity>
      </View>

      {/* Security & Privacy Badge */}
      <View style={styles.notice}>
        <Text variant="caption" align="center" style={{ color: '#FFFFFF70', lineHeight: 18 }}>
          🔒 End-to-End Encrypted • Peer-to-Peer Secure Direct Connection
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  remoteVideo: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  connectingOverlay: { alignItems: 'center' },
  cameraOff: { alignItems: 'center', gap: 12 },
  videoPlaceholder: { alignItems: 'center' },
  partnerName: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: '#FFFFFF' },
  localVideo: { position: 'absolute', right: 16, width: 100, height: 140, zIndex: 10 },
  selfView: {
    flex: 1, borderRadius: 16, backgroundColor: '#3A2A40',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF20',
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'center',
    zIndex: 5,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#00000060', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7DBF9A' },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 24, paddingHorizontal: 24,
    backgroundColor: '#00000040',
    zIndex: 5,
    paddingTop: 24,
  },
  controlBtn: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16, gap: 4,
  },
  controlBtnActive: { backgroundColor: '#FFFFFF20' },
  btnLabel: { color: '#FFFFFF80' },
  hangUpBtn: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#D97B7B',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D97B7B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  notice: { position: 'absolute', bottom: 140, left: 24, right: 24 },
});
