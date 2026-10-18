import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface SecretTutorialModalProps {
  visible: boolean;
  onClose: () => void;
  onStartRealDemo?: () => void;
}

export function SecretTutorialModal({
  visible,
  onClose,
  onStartRealDemo,
}: SecretTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [practiceMode, setPracticeMode] = useState<'4-tap' | 'tap-hold'>('4-tap');
  const [tapCount, setTapCount] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [practiceSuccess, setPracticeSuccess] = useState(false);
  const [feedbackText, setFeedbackText] = useState('Tap the star ✦ 4 times in quick succession');

  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const starScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const holdProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      resetPractice();
      // Start ambient pulse animation
      pulseScale.value = withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [visible]);

  const resetPractice = () => {
    setTapCount(0);
    setIsHolding(false);
    setPracticeSuccess(false);
    holdProgress.value = 0;
    if (practiceMode === '4-tap') {
      setFeedbackText('Tap the star ✦ 4 times in quick succession');
    } else {
      setFeedbackText('Tap ✦ twice quickly, then HOLD on the 3rd tap');
    }
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  };

  // Switch between 4-tap and tap-hold demo
  const switchPracticeMode = (mode: '4-tap' | 'tap-hold') => {
    setPracticeMode(mode);
    setTapCount(0);
    setIsHolding(false);
    setPracticeSuccess(false);
    holdProgress.value = 0;
    if (mode === '4-tap') {
      setFeedbackText('Tap the star ✦ 4 times in quick succession');
    } else {
      setFeedbackText('Tap ✦ twice quickly, then HOLD on the 3rd tap');
    }
  };

  // ── Practice Pad: 4-Tap Handler ──
  const handlePracticeTap = () => {
    if (practiceSuccess) return;

    // Star bounce micro-animation
    starScale.value = withSequence(
      withTiming(0.7, { duration: 60 }),
      withSpring(1, { damping: 12 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (practiceMode === '4-tap') {
      const next = tapCount + 1;
      setTapCount(next);

      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => {
        if (next < 4) {
          setTapCount(0);
          setFeedbackText('Too slow! Try tapping 4 times faster.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }, 1800);

      if (next === 1) setFeedbackText('Tap 1 recorded! 3 more...');
      if (next === 2) setFeedbackText('Tap 2 recorded! Keep going...');
      if (next === 3) setFeedbackText('Tap 3! One final tap...');
      if (next >= 4) {
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        setPracticeSuccess(true);
        setFeedbackText('🎉 Perfect! Pattern recognized! Vault Unlocked!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Tap-Tap-Hold mode tap
      const next = tapCount + 1;
      if (next === 1) {
        setTapCount(1);
        setFeedbackText('Tap 1 recorded! Tap again then hold...');
      } else if (next === 2) {
        setTapCount(2);
        setFeedbackText('Tap 2 recorded! Now PRESS AND HOLD!');
      }
    }
  };

  // ── Practice Pad: Long Press Handler ──
  const handlePracticeLongPress = () => {
    if (practiceMode !== 'tap-hold' || practiceSuccess) return;

    if (tapCount >= 2) {
      setIsHolding(true);
      holdProgress.value = withTiming(1, { duration: 700 });
      setFeedbackText('Holding... Sensor verifying touch rhythm...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      holdTimerRef.current = setTimeout(() => {
        setPracticeSuccess(true);
        setIsHolding(false);
        setFeedbackText('🎉 Excellent! Tap-Tap-Hold completed! Vault Unlocked!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 700);
    } else {
      setFeedbackText('Must tap 2 times first before holding!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handlePracticePressOut = () => {
    if (practiceMode === 'tap-hold' && !practiceSuccess && isHolding) {
      setIsHolding(false);
      holdProgress.value = withTiming(0, { duration: 150 });
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      setFeedbackText('Released too early! Hold for full 0.7s.');
    }
  };

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(isHolding ? 0.8 : 0.3),
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.tutorialContainer}>
          {/* Header & Step Dots */}
          <View style={styles.topHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP {currentStep} OF 4</Text>
            </View>
            <View style={styles.stepIndicators}>
              {[1, 2, 3, 4].map(s => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        s === currentStep
                          ? '#7C8E79'
                          : s < currentStep
                          ? '#B5C4B2'
                          : '#E2DCD5',
                      width: s === currentStep ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── STEP 1: The Disguise Philosophy ── */}
            {currentStep === 1 && (
              <View style={styles.stepBox}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>📔</Text>
                </View>
                <Text style={styles.stepTitle}>100% In Plain Sight</Text>
                <Text style={styles.stepDescription}>
                  This application is completely disguised as a minimalist Japandi personal
                  mindfulness & focus journal called <Text style={{ fontWeight: '700', color: '#242220' }}>Aura</Text>.
                </Text>

                <View style={styles.disguiseCallout}>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletIcon}>✓</Text>
                    <Text style={styles.bulletText}>
                      Zero partner names, romance words, or anniversary clues on the cover.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletIcon}>✓</Text>
                    <Text style={styles.bulletText}>
                      Real working task planner, water counter, and deep work focus timer.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletIcon}>✓</Text>
                    <Text style={styles.bulletText}>
                      Anyone opening your phone sees only an elegant lifestyle journal.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  onPress={() => setCurrentStep(2)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryNextBtnText}>Next: Where Is The Secret Door? →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 2: The Secret Sensor Location ── */}
            {currentStep === 2 && (
              <View style={styles.stepBox}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>✦</Text>
                </View>
                <Text style={styles.stepTitle}>The Hidden Star Sensor</Text>
                <Text style={styles.stepDescription}>
                  On the home screen, scroll down to the <Text style={{ fontWeight: '700', color: '#242220' }}>Daily Affirmation Quote tile</Text>.
                  Look at the tiny decorative star <Text style={{ fontWeight: '700', color: '#7C8E79' }}>✦</Text> in its top right corner.
                </Text>

                {/* Illustrated Mock Card */}
                <View style={styles.mockQuoteCard}>
                  <View style={styles.mockTopRow}>
                    <Text style={{ fontSize: 18, color: '#ABA59E' }}>❝</Text>
                    <View style={styles.highlightSensorBox}>
                      <Text style={styles.mockSparkle}>✦</Text>
                      <View style={styles.sensorPointer}>
                        <Text style={styles.sensorPointerText}>👈 HIDDEN SENSOR</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.mockQuoteText}>
                    "Peace comes from within. Do not seek it without."
                  </Text>
                  <Text style={styles.mockQuoteAuthor}>Daily Affirmation 🌿</Text>
                </View>

                <View style={styles.twoMethodsBox}>
                  <Text style={styles.methodsTitle}>Two Ways to Trigger The Vault:</Text>
                  <Text style={styles.methodLine}>
                    <Text style={{ fontWeight: '700', color: '#7C8E79' }}>1. Rapid 4-Tap:</Text> Tap the ✦ star 4 times within 1.8 seconds.
                  </Text>
                  <Text style={styles.methodLine}>
                    <Text style={{ fontWeight: '700', color: '#7C8E79' }}>2. Rhythm Tap-Tap-Hold:</Text> Tap ✦ twice, then hold down on the 3rd tap.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  onPress={() => setCurrentStep(3)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryNextBtnText}>Next: Try Interactive Practice Pad →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 3: Interactive Practice Pad ── */}
            {currentStep === 3 && (
              <View style={styles.stepBox}>
                <Text style={styles.stepTitle}>Interactive Practice Pad</Text>
                <Text style={styles.stepDescription}>
                  Practice the secret rhythm right here until you feel confident.
                </Text>

                {/* Mode Switcher */}
                <View style={styles.modeTabs}>
                  <TouchableOpacity
                    style={[styles.modeTab, practiceMode === '4-tap' && styles.modeTabActive]}
                    onPress={() => switchPracticeMode('4-tap')}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        practiceMode === '4-tap' && styles.modeTabTextActive,
                      ]}
                    >
                      Method A: 4-Tap
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeTab, practiceMode === 'tap-hold' && styles.modeTabActive]}
                    onPress={() => switchPracticeMode('tap-hold')}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        practiceMode === 'tap-hold' && styles.modeTabTextActive,
                      ]}
                    >
                      Method B: Tap-Tap-Hold
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tap Progress Indicators */}
                <View style={styles.dotsRow}>
                  {[1, 2, 3, 4].map(idx => (
                    <View
                      key={idx}
                      style={[
                        styles.practiceDot,
                        idx <= tapCount && styles.practiceDotFilled,
                        practiceSuccess && styles.practiceDotSuccess,
                      ]}
                    >
                      {idx <= tapCount && (
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Live Interactive Sensor Pad */}
                <View style={styles.practiceSensorPad}>
                  <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
                  <Pressable
                    onPress={handlePracticeTap}
                    onLongPress={handlePracticeLongPress}
                    onPressOut={handlePracticePressOut}
                    delayLongPress={650}
                    style={styles.interactiveStarBtn}
                  >
                    <Animated.Text style={[styles.interactiveStarGlyph, starAnimatedStyle]}>
                      ✦
                    </Animated.Text>
                  </Pressable>
                  <Text style={styles.padPrompt}>
                    {practiceMode === '4-tap' ? 'TAP HERE REPEATEDLY' : 'TAP TWICE, THEN HOLD'}
                  </Text>
                </View>

                {/* Dynamic Feedback Message */}
                <View
                  style={[
                    styles.feedbackPill,
                    practiceSuccess && { backgroundColor: 'rgba(124, 142, 121, 0.2)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.feedbackPillText,
                      practiceSuccess && { color: '#4D684A', fontWeight: '700' },
                    ]}
                  >
                    {feedbackText}
                  </Text>
                </View>

                {/* Reset button */}
                <TouchableOpacity onPress={resetPractice} style={styles.resetPracticeBtn}>
                  <Text style={styles.resetPracticeText}>↻ Reset Practice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryNextBtn, { marginTop: 12 }]}
                  onPress={() => setCurrentStep(4)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryNextBtnText}>Next: Fake Security Passcode →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 4: The Fake Passcode Modal ── */}
            {currentStep === 4 && (
              <View style={styles.stepBox}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🔒</Text>
                </View>
                <Text style={styles.stepTitle}>Disguised Security Passcode</Text>
                <Text style={styles.stepDescription}>
                  When triggered, a disguised modal asks for your <Text style={{ fontWeight: '700', color: '#242220' }}>Journal Passcode</Text>.
                </Text>

                <View style={styles.passcodeInfoCard}>
                  <Text style={styles.passcodeSubhead}>DEFAULT PASSCODE:</Text>
                  <View style={styles.pinPill}>
                    <Text style={styles.pinCodeText}>1  2  3  4</Text>
                  </View>
                  <Text style={styles.passcodeHelp}>
                    Enter <Text style={{ fontWeight: '700' }}>1234</Text> (or your custom PIN set in Preferences).
                    Once correct, it immediately unlocks the Secret Couples Space with chat, photos, and voice notes!
                  </Text>
                </View>

                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeTitle}>QUICK SUMMARY:</Text>
                  <Text style={styles.summaryItem}>1. Find Daily Affirmation card on Home</Text>
                  <Text style={styles.summaryItem}>2. Tap ✦ star 4 times (or Tap-Tap-Hold)</Text>
                  <Text style={styles.summaryItem}>3. Enter 1234 on Passcode Modal</Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryNextBtn, { backgroundColor: '#7C8E79' }]}
                  onPress={() => {
                    onClose();
                    if (onStartRealDemo) onStartRealDemo();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryNextBtnText}>Try on Home Screen Now ✨</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 34, 32, 0.55)',
    justifyContent: 'flex-end',
  },
  tutorialContainer: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 36,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: 'rgba(124, 142, 121, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#7C8E79',
    letterSpacing: 1,
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6E6760',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  stepBox: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#242220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  stepTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#242220',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6E6760',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  disguiseCallout: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C8E79',
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4A4642',
    lineHeight: 18,
  },
  mockQuoteCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
  },
  mockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  highlightSensorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124, 142, 121, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7C8E79',
  },
  mockSparkle: {
    fontSize: 18,
    color: '#7C8E79',
    fontWeight: '700',
  },
  sensorPointer: {
    marginLeft: 2,
  },
  sensorPointerText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#7C8E79',
    letterSpacing: 0.5,
  },
  mockQuoteText: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 15,
    fontStyle: 'italic',
    color: '#242220',
    lineHeight: 22,
    marginBottom: 8,
  },
  mockQuoteAuthor: {
    fontSize: 11,
    color: '#94877A',
    fontFamily: 'Inter_500Medium',
  },
  twoMethodsBox: {
    width: '100%',
    backgroundColor: 'rgba(124, 142, 121, 0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(124, 142, 121, 0.2)',
  },
  methodsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#4D684A',
    marginBottom: 6,
  },
  methodLine: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#4A4642',
    lineHeight: 18,
    marginTop: 4,
  },
  modeTabs: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#ECE8E1',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  modeTabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#94877A',
  },
  modeTabTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: '#242220',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  practiceDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0C8C0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  practiceDotFilled: {
    backgroundColor: '#7C8E79',
    borderColor: '#7C8E79',
  },
  practiceDotSuccess: {
    backgroundColor: '#5A8A55',
    borderColor: '#5A8A55',
  },
  practiceSensorPad: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7C8E79',
    shadowColor: '#7C8E79',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#7C8E79',
  },
  interactiveStarBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 142, 121, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactiveStarGlyph: {
    fontSize: 42,
    color: '#7C8E79',
    fontWeight: '700',
  },
  padPrompt: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#94877A',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  feedbackPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 10,
  },
  feedbackPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#6E6760',
    textAlign: 'center',
  },
  resetPracticeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  resetPracticeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#94877A',
  },
  passcodeInfoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    marginBottom: 16,
  },
  passcodeSubhead: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#94877A',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  pinPill: {
    backgroundColor: '#ECE8E1',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
  },
  pinCodeText: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#242220',
    letterSpacing: 6,
  },
  passcodeHelp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6E6760',
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryBadge: {
    width: '100%',
    backgroundColor: 'rgba(124, 142, 121, 0.1)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 142, 121, 0.2)',
  },
  summaryBadgeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#4D684A',
    letterSpacing: 1,
    marginBottom: 6,
  },
  summaryItem: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#242220',
    lineHeight: 20,
  },
  primaryNextBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#7C8E79',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C8E79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryNextBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
