import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Image,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Storage } from '@/lib/storage';
import { useTheme } from '@/context/ThemeContext';
import { useProfileStore, useChatStore } from '@/store';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { DAILY_QUOTES, INITIAL_PLAN_TASKS, getDailyIndex } from '@/constants/Content';
import { AppData, PlanTask } from '@/lib/appData';
import { SecretTutorialModal } from '@/components/SecretTutorialModal';

const { width } = Dimensions.get('window');

// ─── Minimalist SVG Waveform for Focus Playlist ──────────────────────────────
function SoundWaveSvg({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  return (
    <Svg width={width * 0.42} height={32} viewBox="0 0 160 32">
      <Path
        d="M 4 16 L 4 20 M 12 12 L 12 24 M 20 8 L 20 28 M 28 4 L 28 30 M 36 10 L 36 24 M 44 14 L 44 20 M 52 6 L 52 28 M 60 2 L 60 31 M 68 8 L 68 26 M 76 12 L 76 22 M 84 5 L 84 29 M 92 10 L 92 25 M 100 15 L 100 20 M 108 8 L 108 26 M 116 4 L 116 30 M 124 10 L 124 24 M 132 14 L 132 20 M 140 7 L 140 27 M 148 11 L 148 23 M 156 15 L 156 19"
        stroke={color}
        strokeWidth={isPlaying ? 3 : 2}
        strokeLinecap="round"
        opacity={isPlaying ? 0.9 : 0.45}
      />
    </Svg>
  );
}

// ─── Minimalist Statistics Curve Chart (matching reference) ──────────────────
function StatisticsChartSvg({ color, accent }: { color: string; accent: string }) {
  return (
    <Svg width="100%" height={70} viewBox="0 0 320 70">
      <Defs>
        <SvgGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0.0} />
        </SvgGradient>
      </Defs>
      {/* Area fill */}
      <Path
        d="M 10 50 Q 60 48, 100 38 T 180 44 T 240 20 T 310 16 L 310 70 L 10 70 Z"
        fill="url(#curveGradient)"
      />
      {/* Line curve */}
      <Path
        d="M 10 50 Q 60 48, 100 38 T 180 44 T 240 20 T 310 16"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Circle cx={310} cy={16} r={4.5} fill={color} />
    </Svg>
  );
}

// ─── Disguised Journal Passcode Modal ─────────────────────────────────────────
function DisguisedPasscodeModal({
  visible,
  onDismiss,
  onSuccess,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const shakeX = useSharedValue(0);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleKey = async (key: string) => {
    if (locked) return;
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      try {
        const stored = await Storage.getItem('whisper_pin_hash');
        const hash = btoa(next + 'whisper-salt-v1');
        // Valid if matches stored hash, or default demo PIN '1234', or no hash set
        if (stored === hash || next === '1234' || !stored) {
          setPin('');
          setAttempts(0);
          onSuccess();
        } else {
          shake();
          const newAtt = attempts + 1;
          setAttempts(newAtt);
          setPin('');
          if (newAtt >= 4) setLocked(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {
        setPin('');
      }
    }
  };

  const numpad = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={[styles.pinModal, { backgroundColor: '#FCFAF7' }]}>
          <Text style={{ fontSize: 30, marginBottom: 6 }}>📔</Text>
          <Text variant="subheading" style={{ color: Colors.deepText, fontSize: 18, fontWeight: '600' }}>
            Journal Security Passcode
          </Text>
          <Text variant="caption" style={{ color: Colors.mutedText, marginTop: 4, marginBottom: 20 }}>
            Enter your 4-digit security passcode
          </Text>

          <Animated.View style={[styles.pinDots, shakeStyle]}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: i < pin.length ? Colors.taupe : 'transparent',
                    borderColor: i < pin.length ? Colors.taupe : Colors.taupeLight,
                  },
                ]}
              />
            ))}
          </Animated.View>

          <View style={styles.numpad}>
            {numpad.map((row, r) => (
              <View key={r} style={styles.numRow}>
                {row.map((digit, c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => digit && handleKey(digit)}
                    disabled={!digit || locked}
                    style={[styles.numBtn, !digit && { backgroundColor: 'transparent', elevation: 0 }]}
                    activeOpacity={0.65}
                  >
                    <Text style={{ fontSize: 20, color: Colors.deepText, fontFamily: 'Inter_500Medium' }}>
                      {digit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main HomeScreen (Japandi Warm Stone & Glassmorphic Lifestyle Journal) ────
export default function HomeScreen() {
  const { isDark } = useTheme();
  const { profile } = useProfileStore();
  const { unlock } = useChatStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(2 * 3600 + 45 * 60); // 2h 45m
  const [playlistPlaying, setPlaylistPlaying] = useState(false);
  const [waterCups, setWaterCups] = useState(6);
  const [planTasks, setPlanTasks] = useState<PlanTask[]>([]);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [hasPasscode, setHasPasscode] = useState(false);

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('09:00 AM');
  const [newTaskCat, setNewTaskCat] = useState('Mindfulness');

  // Interactive Tutorial State
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [highlightQuote, setHighlightQuote] = useState(false);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const handleStartRealDemo = () => {
    setHighlightQuote(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 440, animated: true });
    }, 250);
    setTimeout(() => {
      setHighlightQuote(false);
    }, 9000);
  };

  // Secret touch pattern tracking
  const tapHistory = useRef<number[]>([]);

  const dailyQuote = DAILY_QUOTES[getDailyIndex(DAILY_QUOTES)];
  const displayName = profile?.display_name ? profile.display_name.toUpperCase() : 'NAYDA';

  // Load persistent data from AppData
  useEffect(() => {
    AppData.getTasks().then(setPlanTasks);
    AppData.getWaterCount().then(setWaterCups);
    AppData.getFocusSeconds().then(setFocusSeconds);
    Storage.getItem('whisper_pin_hash').then(pin => {
      setHasPasscode(!!pin);
    });
  }, []);

  // Timer simulation with persistence
  useEffect(() => {
    let timer: any;
    if (focusActive) {
      timer = setInterval(() => {
        setFocusSeconds(prev => {
          const next = prev + 1;
          if (next % 30 === 0) AppData.setFocusSeconds(next);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [focusActive]);

  const toggleFocus = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (focusActive) {
      await AppData.setFocusSeconds(focusSeconds);
    }
    setFocusActive(!focusActive);
  };

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  const toggleTask = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await AppData.toggleTask(id);
    setPlanTasks(updated);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    const updated = await AppData.addTask(
      newTaskTitle.trim(),
      newTaskTime.trim() || 'Today',
      newTaskCat.trim() || 'Mindfulness'
    );
    setPlanTasks(updated);
    setNewTaskTitle('');
    setShowAddTaskModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDrinkWater = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.min(8, waterCups + 1);
    setWaterCups(next);
    await AppData.setWaterCount(next);
  };

  const handleUndoWater = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, waterCups - 1);
    setWaterCups(next);
    await AppData.setWaterCount(next);
  };

  // ── Secret Touch Pattern Handler (Hidden on the Inspirational Quote Card ✦) ──
  const handleSparkleTap = () => {
    const now = Date.now();
    tapHistory.current = tapHistory.current.filter(t => now - t < 1800);
    tapHistory.current.push(now);

    // Subtle tactile feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 4-tap shortcut pattern
    if (tapHistory.current.length >= 4) {
      tapHistory.current = [];
      triggerSecretAccess();
    }
  };

  const handleSparkleLongPress = () => {
    tapHistory.current = [];
    triggerSecretAccess();
  };

  const triggerSecretAccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (hasPasscode) {
      setShowPasscodeModal(true);
    } else {
      unlock();
      router.push('/(chat)/conversation');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.evening.bg : Colors.bgLinen }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header: Good Day, NAYDA + Guide Pill + Bell Icon ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingLabel, { color: Colors.mutedText }]}>
              Good Day,
            </Text>
            <Text style={[styles.userNameTitle, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
              {displayName}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.guidePillBtn}
              onPress={() => setShowTutorialModal(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.guidePillText}>✦ Tutorial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFF80' }]}
              onPress={() => Alert.alert('Notifications', 'All mindful notifications up to date.')}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Split: Botanical Card (Left) & Focus Card (Right) ── */}
        <View style={styles.heroRow}>
          {/* Botanical Zen Photo Card (Left) */}
          <View style={styles.botanicalCard}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&q=80',
              }}
              style={styles.botanicalImage}
              resizeMode="cover"
            />
            <View style={styles.botanicalBadge}>
              <Text style={{ fontSize: 11, color: '#FFFFFF', fontFamily: 'Inter_500Medium' }}>
                Zen Flow 🌿
              </Text>
            </View>
          </View>

          {/* Focus Card (Right) */}
          <View
            style={[
              styles.focusCard,
              { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB0' },
            ]}
          >
            <View style={styles.focusHeader}>
              <Text style={styles.focusLabel}>Focus</Text>
              <View style={[styles.dotPill, { backgroundColor: focusActive ? Colors.sage : Colors.sand }]} />
            </View>

            <Text style={[styles.focusTitle, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
              Deep Work
            </Text>

            <Text style={[styles.focusTime, { color: isDark ? '#EFECE6' : Colors.taupeDark }]}>
              {formatTimer(focusSeconds)}
            </Text>

            <TouchableOpacity
              onPress={toggleFocus}
              style={[
                styles.focusStartBtn,
                { backgroundColor: focusActive ? Colors.sage : Colors.taupe },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.focusStartText}>
                {focusActive ? 'Pause' : 'Start'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Today's Plan Checklist Card ── */}
        <Card elevated style={[styles.planCard, { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB8' }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
                Today's Plan
              </Text>
              <Text style={[styles.taskCountText, { color: Colors.mutedText }]}>
                {planTasks.filter(t => t.done).length}/{planTasks.length} Completed
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddTaskModal(true)}
              style={styles.addTaskHeaderBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.addTaskHeaderBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskList}>
            {planTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => toggleTask(task.id)}
                style={styles.taskItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.taskCheckCircle,
                    {
                      borderColor: task.done ? Colors.sage : Colors.taupeLight,
                      backgroundColor: task.done ? Colors.sage : 'transparent',
                    },
                  ]}
                >
                  {task.done && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: isDark ? '#FFFFFF' : Colors.deepText },
                      task.done && styles.taskDoneText,
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text style={[styles.taskTime, { color: Colors.mutedText }]}>
                    {task.time} • {task.category}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Statistics / Consistency Curve Chart Card ── */}
        <Card elevated style={[styles.statCard, { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB8' }]}>
          <View style={styles.statHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
                Statistics
              </Text>
              <Text style={{ fontSize: 12, color: Colors.mutedText, marginTop: 2 }}>
                Mindful Weekly Habit Flow
              </Text>
            </View>

            <View style={[styles.percentBadge, { backgroundColor: Colors.sageLight + '70' }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.sageDark }}>
                +24%
              </Text>
              <Text style={{ fontSize: 10, color: Colors.sageDark }}>vs last week</Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <StatisticsChartSvg
              color={Colors.sage}
              accent={Colors.taupe}
            />
          </View>
        </Card>

        {/* ── Dual Tiles: Motivational Quote & Water Reminder ── */}
        <View style={styles.tileGrid}>
          {/* Inspirational Quote Card (Secret Trigger Inside ✦) */}
          <Card
            elevated
            style={[
              styles.quoteTile,
              { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB8' },
              highlightQuote && styles.quoteTileHighlighted,
            ]}
          >
            {highlightQuote && (
              <View style={styles.quoteHighlightBanner}>
                <Text style={styles.quoteHighlightBannerText}>👇 TAP ✦ 4 TIMES HERE</Text>
              </View>
            )}
            <View style={styles.quoteTopRow}>
              <Text style={{ fontSize: 24, color: Colors.taupeLight }}>❝</Text>
              {/* Secret Touch Sensor: Tap ✦ (Tap-Tap-Hold or 4-Tap) */}
              <Pressable
                onPress={handleSparkleTap}
                onLongPress={handleSparkleLongPress}
                delayLongPress={700}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={[
                  styles.secretSparklePressable,
                  highlightQuote && styles.secretSparkleHighlighted,
                ]}
              >
                <Text style={[styles.secretSparkleGlyph, highlightQuote && { color: '#7C8E79', fontSize: 22 }]}>✦</Text>
              </Pressable>
            </View>

            <Text style={[styles.quoteText, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
              "{dailyQuote}"
            </Text>

            <View style={styles.quoteBottom}>
              <Text style={{ fontSize: 11, color: Colors.mutedText }}>
                Daily Affirmation 🌿
              </Text>
            </View>
          </Card>

          {/* Water Reminder Card */}
          <Card
            elevated
            style={[
              styles.waterTile,
              { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB8' },
            ]}
          >
            <View style={styles.waterTopRow}>
              <Text style={{ fontSize: 13, color: Colors.mutedText, fontFamily: 'Inter_500Medium' }}>
                Water Reminder
              </Text>
              <Text style={{ fontSize: 18 }}>💧</Text>
            </View>

            <Text style={[styles.waterCount, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
              {waterCups}/8 <Text style={{ fontSize: 13, fontWeight: '400', color: Colors.mutedText }}>Cups</Text>
            </Text>

            {/* Progress track */}
            <View style={styles.waterTrack}>
              <View
                style={[
                  styles.waterFill,
                  { width: `${(waterCups / 8) * 100}%`, backgroundColor: Colors.sage },
                ]}
              />
            </View>

            <View style={styles.waterActionRow}>
              <TouchableOpacity
                onPress={handleUndoWater}
                style={[styles.waterUndoBtn, { borderColor: Colors.taupeLight }]}
                activeOpacity={0.7}
              >
                <Text style={{ color: Colors.taupe, fontSize: 11, fontWeight: '600' }}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDrinkWater}
                style={[styles.waterAddBtn, { backgroundColor: Colors.taupe }]}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>+ Drink</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* ── Focus Playlist Soundwave Widget (from reference image) ── */}
        <Card elevated style={[styles.playlistCard, { backgroundColor: isDark ? Colors.evening.surfaceElevated : '#FFFFFFB8' }]}>
          <View style={styles.playlistRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 11, color: Colors.mutedText, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                FOCUS PLAYLIST
              </Text>
              <Text style={[styles.playlistTitle, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
                Lo-fi Essentials
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPlaylistPlaying(p => !p);
              }}
              style={[styles.playPauseBtn, { backgroundColor: Colors.taupeDark }]}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 14 }}>
                {playlistPlaying ? '❚❚' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <SoundWaveSvg
              isPlaying={playlistPlaying}
              color={playlistPlaying ? Colors.sage : Colors.taupeLight}
            />
          </View>
        </Card>
      </ScrollView>

      {/* ── Add Custom Mindful Task Modal ── */}
      <Modal
        visible={showAddTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAddTaskModal(false)} />
          <View style={[styles.addTaskModalBox, { backgroundColor: isDark ? Colors.evening.surface : '#FFFFFF' }]}>
            <Text style={[styles.modalHeading, { color: isDark ? '#FFFFFF' : Colors.deepText }]}>
              New Plan Task
            </Text>
            <Text style={{ fontSize: 13, color: Colors.mutedText, marginBottom: 16 }}>
              Add an intention or focus milestone to your day.
            </Text>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.inputMiniLabel}>TASK DESCRIPTION</Text>
                <TextInput
                  style={[styles.taskTextInput, { color: isDark ? '#FFFFFF' : Colors.deepText, borderColor: Colors.taupeLight }]}
                  placeholder="e.g. Afternoon Tea & Journaling"
                  placeholderTextColor={Colors.mutedText}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  autoFocus
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputMiniLabel}>TIME / SLOT</Text>
                  <TextInput
                    style={[styles.taskTextInput, { color: isDark ? '#FFFFFF' : Colors.deepText, borderColor: Colors.taupeLight }]}
                    placeholder="03:00 PM"
                    placeholderTextColor={Colors.mutedText}
                    value={newTaskTime}
                    onChangeText={setNewTaskTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputMiniLabel}>CATEGORY</Text>
                  <TextInput
                    style={[styles.taskTextInput, { color: isDark ? '#FFFFFF' : Colors.deepText, borderColor: Colors.taupeLight }]}
                    placeholder="Mindfulness"
                    placeholderTextColor={Colors.mutedText}
                    value={newTaskCat}
                    onChangeText={setNewTaskCat}
                  />
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  onPress={() => setShowAddTaskModal(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={{ color: Colors.mutedText, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateTask}
                  style={[styles.modalSubmitBtn, { backgroundColor: Colors.sage }]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Save Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Disguised Passcode Modal ── */}
      <DisguisedPasscodeModal
        visible={showPasscodeModal}
        onDismiss={() => setShowPasscodeModal(false)}
        onSuccess={() => {
          setShowPasscodeModal(false);
          unlock();
          router.push('/(chat)/conversation');
        }}
      />

      {/* ── Interactive Tutorial Guide Modal ── */}
      <SecretTutorialModal
        visible={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onStartRealDemo={handleStartRealDemo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  greetingLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  userNameTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  guidePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 142, 121, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7C8E79',
  },
  guidePillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#7C8E79',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    height: 175,
  },
  botanicalCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2B2724',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  botanicalImage: {
    width: '100%',
    height: '100%',
  },
  botanicalBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(43, 39, 36, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  focusCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#2B2724',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusLabel: {
    fontSize: 12,
    color: Colors.mutedText,
    fontFamily: 'Inter_500Medium',
  },
  dotPill: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  focusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  focusTime: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginVertical: 4,
  },
  focusStartBtn: {
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusStartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  planCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  taskCountText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  taskList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  taskCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  taskDoneText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskTime: {
    fontSize: 11,
  },
  statCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  tileGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quoteTile: {
    flex: 1.15,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  quoteTileHighlighted: {
    borderColor: '#7C8E79',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C8E79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  quoteHighlightBanner: {
    backgroundColor: '#7C8E79',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  quoteHighlightBannerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  quoteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secretSparklePressable: {
    padding: 6,
  },
  secretSparkleHighlighted: {
    backgroundColor: 'rgba(124, 142, 121, 0.25)',
    borderRadius: 14,
  },
  secretSparkleGlyph: {
    fontSize: 18,
    color: Colors.taupe,
  },
  quoteText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 19,
    marginVertical: 6,
  },
  quoteBottom: {
    marginTop: 4,
  },
  waterTile: {
    flex: 0.85,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  waterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterCount: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginVertical: 4,
  },
  waterTrack: {
    height: 6,
    backgroundColor: 'rgba(124, 142, 121, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  waterFill: {
    height: '100%',
    borderRadius: 3,
  },
  addTaskHeaderBtn: {
    backgroundColor: '#7C8E79',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addTaskHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  waterActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterUndoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addTaskModalBox: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
  },
  modalHeading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    marginBottom: 4,
  },
  inputMiniLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#94877A',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  taskTextInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  playlistCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 10,
  },
  playlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playlistTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  playPauseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 39, 36, 0.4)',
    justifyContent: 'flex-end',
  },
  pinModal: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  numpad: {
    width: '100%',
    gap: 12,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  numBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2B2724',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});
