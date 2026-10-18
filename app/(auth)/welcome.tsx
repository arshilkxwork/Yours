import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { isLiveSupabaseConfigured } from '@/lib/authService';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(20);

  useEffect(() => {
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
    titleY.value = withDelay(200, withSpring(0, { damping: 18 }));
    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 700 }));
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    buttonsY.value = withDelay(800, withSpring(0, { damping: 18 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Ambient background decoration */}
      <View style={styles.ambientBlobTop} />
      <View style={styles.ambientBlobBottom} />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 36 },
        ]}
      >
        {/* Top database connectivity indicator */}
        <View style={styles.dbIndicator}>
          <View
            style={[
              styles.dbDot,
              { backgroundColor: isLiveSupabaseConfigured() ? '#7C8E79' : '#8A9E88' },
            ]}
          />
          <Text style={styles.dbText}>
            {isLiveSupabaseConfigured() ? 'Cloud Database Connected' : 'Encrypted Storage Ready'}
          </Text>
        </View>

        {/* Center Aesthetic Emblem */}
        <View style={styles.emblemContainer}>
          <View style={styles.emblemRing}>
            <View style={styles.emblemInner}>
              <Text style={styles.emblemGlyph}>✦</Text>
            </View>
          </View>
          <View style={styles.zenPill}>
            <Text style={styles.zenPillText}>MINDFUL LIVING & FOCUS</Text>
          </View>
        </View>

        {/* Title & Philosophy */}
        <Animated.View style={[styles.titleArea, titleStyle]}>
          <Text style={styles.appName}>AURA</Text>
          <Text style={styles.appCategory}>PERSONAL JOURNAL</Text>
          <Animated.View style={subtitleStyle}>
            <Text style={styles.tagline}>
              Cultivate intentional days with mindful reflections, focus tracking, and private thoughts.
            </Text>
          </Animated.View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonsArea, buttonsStyle]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Sign In to Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </TouchableOpacity>

          <View style={styles.trustBadge}>
            <Text style={styles.trustText}>🔒 Local AES-256 Storage • Zero Tracking • Disguised Vault</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE8E1',
  },
  ambientBlobTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(215, 209, 200, 0.45)',
  },
  ambientBlobBottom: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 142, 121, 0.08)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  dbIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'center',
    marginBottom: 40,
  },
  dbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dbText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#7C8E79',
    letterSpacing: 0.3,
  },
  emblemContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emblemRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#242220',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  emblemInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#242220',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  emblemGlyph: {
    fontSize: 32,
    color: '#7C8E79',
  },
  zenPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  zenPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#94877A',
    letterSpacing: 1.6,
  },
  titleArea: {
    alignItems: 'center',
    marginTop: 14,
  },
  appName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 52,
    color: '#242220',
    letterSpacing: 4,
    textAlign: 'center',
  },
  appCategory: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#94877A',
    letterSpacing: 3,
    marginTop: -4,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6E6760',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  buttonsArea: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#7C8E79',
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C8E79',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#242220',
  },
  trustBadge: {
    marginTop: 8,
  },
  trustText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#94877A',
    textAlign: 'center',
  },
});
