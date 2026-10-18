import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Alert, Modal, Image, Platform, KeyboardAvoidingView,
  ActivityIndicator, Pressable, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, FadeInUp,
} from 'react-native-reanimated';
import { format, isToday, isYesterday } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore, useProfileStore, useChatStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/Colors';
import { DEMO_MESSAGES, DEMO_COUPLE_ID, DEMO_PARTNER } from '@/lib/demo';
import { AppData, ChatMessage } from '@/lib/appData';
import { isLiveSupabaseConfigured } from '@/lib/authService';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  reply_to: string | null;
  is_pinned: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  media_attachments?: {
    id: string;
    storage_path: string;
    mime_type: string;
    size: number;
    duration: number | null;
  }[];
  reactions?: { emoji: string; user_id: string }[];
  read_at?: string | null;
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = {
  '❤️ Hearts': ['❤️','🧡','💛','💚','💙','💜','🤍','🖤','💕','💞','💓','💗','💖','💝','💘','💟','♥️','💔','❣️','💏','💑'],
  '😊 Smiles': ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝'],
  '🤗 People': ['🤗','🫂','💆','💅','🙏','👏','🫶','❤️‍🔥','🤝','👋','✌️','🤞','🫰','👍','👎','🙌','🤲'],
  '🌸 Nature': ['🌸','🌺','🌻','🌹','🌷','💐','🌿','🍀','🌱','🍁','🍂','🌙','⭐','✨','💫','🌈','☀️','🌤️','🌊','🔥'],
  '🍓 Food': ['🍓','🍒','🍑','🍊','🍋','🍇','🍉','🍎','🍰','🎂','🍩','🍪','🍫','🍬','🍭','☕','🫖','🍵','🧋','🍷'],
  '🎵 Fun': ['🎵','🎶','🎸','🎹','🎤','🎧','🎨','🖌️','✏️','📝','💌','📸','🎁','🎀','🎊','🎉','🥂','💍','👑','🌟'],
};

const REACTION_EMOJIS = ['❤️', '😂', '😍', '😢', '😮', '👍', '🔥', '🥰'];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const [recent, setRecent] = useState<string[]>([]);

  const filtered = search
    ? Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] ?? [];

  const handleSelect = async (emoji: string) => {
    setRecent(prev => [emoji, ...prev.filter(e => e !== emoji)].slice(0, 12));
    onSelect(emoji);
    await Haptics.selectionAsync();
  };

  return (
    <View style={[styles.emojiPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Search */}
      <View style={[styles.emojiSearch, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search emoji..."
          placeholderTextColor={colors.textSubtle}
          style={{ color: colors.text, fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1 }}
        />
      </View>

      {/* Category tabs */}
      {!search && (
        <View style={styles.emojiCats}>
          {recent.length > 0 && (
            <TouchableOpacity
              onPress={() => setActiveCategory('__recent__')}
              style={[styles.emojiCatBtn, activeCategory === '__recent__' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
            >
              <Text style={{ fontSize: 18 }}>🕐</Text>
            </TouchableOpacity>
          )}
          {Object.keys(EMOJI_CATEGORIES).map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.emojiCatBtn, activeCategory === cat && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
            >
              <Text style={{ fontSize: 18 }}>{cat.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Emoji grid */}
      <FlatList
        data={activeCategory === '__recent__' ? recent : filtered}
        keyExtractor={(item, i) => `${item}-${i}`}
        numColumns={8}
        contentContainerStyle={styles.emojiGrid}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)} style={styles.emojiItem}>
            <Text style={{ fontSize: 24 }}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isMine,
  onLongPress,
  onReact,
  replyTo,
}: {
  message: Message;
  isMine: boolean;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
  replyTo?: Message | null;
}) {
  const { colors, accentColor } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const bubbleColor = isMine
    ? accentColor
    : colors.surface;
  const textColor = isMine ? '#FFFFFF' : colors.text;

  const playAudio = async () => {
    const audioUri = message.content ?? (message.media_attachments?.[0]
      ? supabase.storage.from('private-media').getPublicUrl(message.media_attachments[0].storage_path).data.publicUrl
      : null);
    if (!audioUri) return;

    if (playing) {
      await sound?.pauseAsync();
      setPlaying(false);
      return;
    }
    try {
      if (sound) {
        await sound.playAsync();
        setPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        setSound(newSound);
        setPlaying(true);
        newSound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        });
      }
    } catch { /* noop */ }
  };

  const reactions = message.reactions ?? [];
  const reactionGroups = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const isDeleted = !!message.deleted_at;

  return (
    <Animated.View entering={FadeInUp.duration(250).springify()}>
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        {/* Reply preview */}
        {replyTo && (
          <View style={[styles.replyPreview, { backgroundColor: colors.border, borderLeftColor: accentColor }]}>
            <Text variant="caption" style={{ color: accentColor }}>{isMine ? 'You' : 'Partner'}</Text>
            <Text variant="caption" style={{ color: colors.textMuted }} numberOfLines={1}>
              {replyTo.content ?? '[media]'}
            </Text>
          </View>
        )}

        <Pressable
          onLongPress={() => { onLongPress(); setShowReactions(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          onPress={() => setShowReactions(false)}
          style={[
            styles.bubble,
            { backgroundColor: bubbleColor, maxWidth: width * 0.72 },
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            isDeleted && { opacity: 0.5 },
          ]}
        >
          {isDeleted ? (
            <Text variant="caption" style={{ color: isMine ? '#FFFFFF80' : colors.textMuted, fontStyle: 'italic' }}>
              Message deleted
            </Text>
          ) : message.type === 'image' ? (
            <Image
              source={{
                uri: message.content ?? (message.media_attachments?.[0]
                  ? supabase.storage.from('private-media').getPublicUrl(message.media_attachments[0].storage_path).data.publicUrl
                  : ''),
              }}
              style={styles.messageImage}
            />
          ) : message.type === 'audio' ? (
            <TouchableOpacity onPress={playAudio} style={styles.audioMsg}>
              <Text style={{ fontSize: 22 }}>{playing ? '⏸' : '▶️'}</Text>
              <View style={styles.waveform}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <View key={i} style={[styles.waveBar, { height: 4 + Math.random() * 16, backgroundColor: isMine ? '#FFFFFF60' : accentColor + '80' }]} />
                ))}
              </View>
              <Text variant="caption" style={{ color: isMine ? '#FFFFFF80' : colors.textMuted }}>
                {(message.media_attachments?.[0]?.duration ?? (message as any).audio_duration)
                  ? `${Math.round(message.media_attachments?.[0]?.duration ?? (message as any).audio_duration)}s`
                  : '—'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: textColor, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 }}>
              {message.content}
            </Text>
          )}

          {/* Timestamp + status */}
          <View style={styles.msgMeta}>
            <Text style={{ fontSize: 10, color: isMine ? '#FFFFFF60' : colors.textSubtle }}>
              {format(new Date(message.created_at), 'h:mm a')}
            </Text>
            {isMine && (
              <Text style={{ fontSize: 10, color: message.read_at ? '#FFFFFF' : '#FFFFFF60' }}>
                {message.read_at ? ' ✓✓' : ' ✓'}
              </Text>
            )}
            {message.edited_at && (
              <Text style={{ fontSize: 9, color: isMine ? '#FFFFFF50' : colors.textSubtle }}> edited</Text>
            )}
          </View>
        </Pressable>

        {/* Reaction chips */}
        {Object.keys(reactionGroups).length > 0 && (
          <View style={styles.reactionRow}>
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => onReact(emoji)}
                style={[styles.reactionChip, { backgroundColor: colors.blush, borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                {count > 1 && <Text variant="caption" style={{ color: colors.textMuted }}>{count}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick reactions */}
        {showReactions && (
          <View style={[styles.quickReactions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {REACTION_EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => { onReact(e); setShowReactions(false); }}
                style={styles.qrBtn}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Conversation Screen ─────────────────────────────────────────────────
export default function ConversationScreen() {
  const { colors, isDark, accentColor } = useTheme();
  const { user } = useAuthStore();
  const { profile, partnerProfile } = useProfileStore();
  const { lock } = useChatStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState<Message | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [partnerName, setPartnerName] = useState('Liam');
  const [enteredCode, setEnteredCode] = useState('');
  const [enteredPartnerName, setEnteredPartnerName] = useState('');
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load couple + messages + pairing ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1. Load pairing info
      const code = await AppData.getPairingCode();
      setPairingCode(code);
      const name = await AppData.getPartnerName();
      setPartnerName(name);
      setEnteredPartnerName(name);

      // 2. Always load local persistent messages first
      const localMsgs = await AppData.getMessages();
      setMessages(localMsgs as Message[]);
      setCoupleId('aura_couple');
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);

      // 2. If live Supabase cloud backend is configured and user logged in
      if (isLiveSupabaseConfigured() && user) {
        try {
          const { data: couple } = await supabase
            .from('couples')
            .select('id')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .single();
          if (couple) {
            setCoupleId(couple.id);
            await loadMessages(couple.id);
          }
        } catch (err) {
          console.warn('Supabase couple load skipped:', err);
        }
      }
    })();
  }, [user]);

  const loadMessages = async (cid: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*, media_attachments(*), reactions:message_reactions(*)')
        .eq('couple_id', cid)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data && data.length > 0) {
        setMessages(data as Message[]);
      }
    } catch { /* noop */ }
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const markRead = async (messageId: string) => {
    if (!user) return;
    await supabase.from('message_receipts').upsert({
      message_id: messageId,
      user_id: user.id,
      read_at: new Date().toISOString(),
    });
  };

  // ── Send text message ──
  const sendMessage = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    setShowEmoji(false);

    // Save to AppData persistent database
    const updated = await AppData.sendMessage(content, 'text', replyTo?.id ?? null);
    setMessages(updated as Message[]);
    setReplyTo(null);
    setSending(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // If live Supabase cloud configured, also insert to Supabase
    if (isLiveSupabaseConfigured() && user && coupleId && coupleId !== 'aura_couple') {
      try {
        await supabase.from('messages').insert({
          couple_id: coupleId,
          sender_id: user.id,
          content,
          type: 'text',
          reply_to: replyTo?.id ?? null,
        });
      } catch (err) {
        console.warn('Supabase message insert error:', err);
      }
    } else {
      // Simulate partner typing & response in standalone mode
      setTimeout(() => {
        setPartnerTyping(true);
        setTimeout(async () => {
          setPartnerTyping(false);
          const replies = [
            'You always make my day brighter 🌸',
            'I adore you so much! Counting down the hours ✨',
            'Just was thinking about you right now 🥰',
            'So grateful for our quiet secret space ❤️',
            'Holding you close in my heart today 🌿',
          ];
          const replyText = replies[Math.floor(Math.random() * replies.length)];
          const withReply = await AppData.sendMessage(replyText, 'text');
          setMessages(withReply as Message[]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }, 1600);
      }, 800);
    }
  };

  // ── Typing indicator broadcast ──
  const handleTextChange = (val: string) => {
    setText(val);
    if (!coupleId || !user || !isLiveSupabaseConfigured()) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    supabase.channel(`couple-${coupleId}`).send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } });
    typingTimer.current = setTimeout(() => {}, 3000);
  };

  // ── Send emoji ──
  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  // ── React to message ──
  const reactToMessage = async (messageId: string, emoji: string) => {
    const updated = await AppData.reactToMessage(messageId, emoji);
    setMessages(updated as Message[]);
    if (isLiveSupabaseConfigured() && user) {
      try {
        const existing = messages.find(m => m.id === messageId)?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
        if (existing) {
          await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', user.id).eq('emoji', emoji);
        } else {
          await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji });
        }
      } catch { /* noop */ }
    }
  };

  // ── Delete message ──
  const deleteMessage = async (messageId: string) => {
    Alert.alert('Delete Message', 'Delete this message for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await AppData.deleteMessage(messageId);
          setMessages(updated as Message[]);
          if (isLiveSupabaseConfigured()) {
            try {
              await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId);
            } catch { /* noop */ }
          }
          setShowActionSheet(null);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  // ── Start recording ──
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission Required', 'Microphone access is needed for voice messages.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimer.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch { Alert.alert('Error', 'Could not start recording.'); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) return;

      // Save to AppData persistent database
      const updated = await AppData.sendMessage(uri, 'audio', null, recordingDuration);
      setMessages(updated as Message[]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Cloud upload if Supabase live
      if (isLiveSupabaseConfigured() && coupleId && user && coupleId !== 'aura_couple') {
        try {
          const path = `voice/${coupleId}/${Date.now()}.m4a`;
          const response = await fetch(uri);
          const blob = await response.blob();
          await supabase.storage.from('private-media').upload(path, blob, { contentType: 'audio/m4a' });
        } catch { /* noop */ }
      }
    } catch {
      Alert.alert('Error', 'Could not save voice message.');
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    setRecording(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // ── Send image ──
  const sendImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Photo library access needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsMultipleSelection: true });
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    for (const asset of result.assets) {
      // Save locally to AppData
      const updated = await AppData.sendMessage(asset.uri, 'image');
      setMessages(updated as Message[]);

      // Cloud upload if Supabase is live
      if (isLiveSupabaseConfigured() && coupleId && user && coupleId !== 'aura_couple') {
        try {
          const ext = asset.uri.split('.').pop() ?? 'jpg';
          const path = `images/${coupleId}/${Date.now()}.${ext}`;
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          await supabase.storage.from('private-media').upload(path, blob, { contentType: `image/${ext}` });
        } catch { /* noop */ }
      }
    }
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Date separators ──
  const messagesWithSeparators = useMemo(() => {
    const result: (Message | { type: 'separator'; date: string; id: string })[] = [];
    let lastDate = '';
    for (const msg of messages) {
      const d = msg.created_at.split('T')[0];
      if (d !== lastDate) {
        result.push({ type: 'separator', date: msg.created_at, id: `sep-${d}` });
        lastDate = d;
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accentColor} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.chatHeader, { backgroundColor: colors.header, paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { lock(); router.back(); }} style={styles.backBtn}>
          <Text style={{ fontSize: 24, color: colors.accent }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={{ fontSize: 20 }}>🌸</Text>
          </View>
          <View>
            <Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '600' }}>
              {partnerName || partnerProfile?.display_name || 'Liam'}
            </Text>
            {partnerTyping ? (
              <Text variant="caption" style={{ color: accentColor }}>typing...</Text>
            ) : (
              <Text variant="caption" style={{ color: colors.textMuted }}>Connected • Encrypted</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowPairingModal(true)} style={styles.headerBtn}>
            <Text style={{ fontSize: 19 }}>🔑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(chat)/voice-call')} style={styles.headerBtn}>
            <Text style={{ fontSize: 20 }}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(chat)/video-call')} style={styles.headerBtn}>
            <Text style={{ fontSize: 20 }}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* ── Messages ── */}
        <FlatList
          ref={flatListRef}
          data={messagesWithSeparators}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            if ('type' in item && item.type === 'separator') {
              return (
                <View style={styles.dateSeparator}>
                  <View style={[styles.sepLine, { backgroundColor: colors.border }]} />
                  <Text variant="caption" style={[styles.sepText, { color: colors.textMuted, backgroundColor: colors.bg }]}>
                    {formatDate(item.date)}
                  </Text>
                  <View style={[styles.sepLine, { backgroundColor: colors.border }]} />
                </View>
              );
            }
            const msg = item as Message;
            const isMine = msg.sender_id === user?.id;
            const reply = msg.reply_to ? messages.find(m => m.id === msg.reply_to) ?? null : null;
            return (
              <MessageBubble
                message={msg}
                isMine={isMine}
                replyTo={reply}
                onReact={(emoji) => reactToMessage(msg.id, emoji)}
                onLongPress={() => setShowActionSheet(msg)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>💌</Text>
              <Text variant="subheading" align="center" style={{ color: colors.text }}>Start your story</Text>
              <Text variant="body" align="center" style={{ color: colors.textMuted, marginTop: 8, lineHeight: 24 }}>
                Send your first message.{'\n'}Just the two of you.
              </Text>
            </View>
          }
        />

        {/* ── Reply preview ── */}
        {replyTo && (
          <View style={[styles.replyBar, { backgroundColor: colors.inputBg, borderColor: accentColor }]}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={{ color: accentColor }}>Replying to message</Text>
              <Text variant="caption" style={{ color: colors.textMuted }} numberOfLines={1}>{replyTo.content}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Emoji picker ── */}
        {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 4 }]}>
          {isRecording ? (
            <View style={styles.recordingBar}>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecord}>
                <Text>🗑 Cancel</Text>
              </TouchableOpacity>
              <View style={styles.recordingIndicator}>
                <View style={[styles.recDot, { backgroundColor: '#D97B7B' }]} />
                <Text variant="bodyMedium" style={{ color: colors.text }}>{recordingDuration}s</Text>
              </View>
              <TouchableOpacity onPress={stopRecording} style={[styles.sendBtn, { backgroundColor: accentColor }]}>
                <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Send</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <TouchableOpacity onPress={() => setShowEmoji(!showEmoji)} style={styles.inputBtn}>
                <Text style={{ fontSize: 22 }}>😊</Text>
              </TouchableOpacity>
              <View style={[styles.textInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder="Message..."
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  maxLength={4000}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
              {text.trim() ? (
                <TouchableOpacity
                  onPress={sendMessage}
                  style={[styles.sendBtn, { backgroundColor: accentColor }]}
                  disabled={sending}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 18 }}>↑</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity onPress={sendImage} style={styles.inputBtn}>
                    <Text style={{ fontSize: 22 }}>📎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPressIn={startRecording} style={styles.inputBtn}>
                    <Text style={{ fontSize: 22 }}>🎙️</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Message action sheet ── */}
      <Modal visible={!!showActionSheet} transparent animationType="fade">
        <Pressable style={styles.actionOverlay} onPress={() => setShowActionSheet(null)}>
          <View style={[styles.actionSheet, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => { setReplyTo(showActionSheet); setShowActionSheet(null); }} style={styles.actionItem}>
              <Text>↩️</Text><Text variant="body" style={{ color: colors.text }}>Reply</Text>
            </TouchableOpacity>
            {showActionSheet?.sender_id === user?.id && (
              <TouchableOpacity onPress={() => { if (showActionSheet) deleteMessage(showActionSheet.id); }} style={[styles.actionItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text>🗑️</Text><Text variant="body" style={{ color: '#D97B7B' }}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowActionSheet(null)} style={[styles.actionItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text>✕</Text><Text variant="body" style={{ color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Secret Pairing Modal ── */}
      <Modal visible={showPairingModal} transparent animationType="slide" onRequestClose={() => setShowPairingModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPairingModal(false)} />
          <View style={[styles.pairingModalBox, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🔑</Text>
            <Text variant="subheading" style={{ color: colors.text, textAlign: 'center', fontWeight: '600', fontSize: 18 }}>
              Secret Pairing Code
            </Text>
            <Text variant="caption" style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Share your code with your partner or connect their code to pair your private channel.
            </Text>

            <View style={[styles.pairingCodeCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text variant="caption" style={{ color: colors.textMuted, letterSpacing: 1 }}>YOUR PRIVATE PAIRING CODE</Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: accentColor, letterSpacing: 3, marginTop: 4 }}>
                {pairingCode || 'AURA-8472'}
              </Text>
            </View>

            <View style={{ gap: 12, marginTop: 16 }}>
              <View>
                <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 4 }}>PARTNER'S NAME / NICKNAME</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  placeholder="e.g. Liam, Sweetheart"
                  placeholderTextColor={colors.textSubtle}
                  value={enteredPartnerName}
                  onChangeText={setEnteredPartnerName}
                />
              </View>

              <View>
                <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 4 }}>CONNECT PARTNER'S CODE</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  placeholder="e.g. AURA-1234"
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="characters"
                  value={enteredCode}
                  onChangeText={setEnteredCode}
                />
              </View>

              <TouchableOpacity
                onPress={async () => {
                  if (enteredPartnerName.trim()) {
                    await AppData.setPartnerName(enteredPartnerName.trim());
                    setPartnerName(enteredPartnerName.trim());
                  }
                  setShowPairingModal(false);
                  Alert.alert('Connection Saved', 'Private channel updated successfully.');
                }}
                style={[styles.savePairingBtn, { backgroundColor: accentColor }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Save &amp; Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F4DCE5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8 },
  messageList: { padding: 16, gap: 4, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 48 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  sepLine: { flex: 1, height: 1 },
  sepText: { paddingHorizontal: 8, fontSize: 11 },
  messageRow: { marginVertical: 2, alignItems: 'flex-start' },
  messageRowMine: { alignItems: 'flex-end' },
  replyPreview: {
    borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 4, marginBottom: 4,
    borderRadius: 4, maxWidth: '70%',
  },
  bubble: {
    borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6,
    minWidth: 60, gap: 4,
  },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleTheirs: { borderBottomLeftRadius: 6 },
  messageImage: { width: 220, height: 180, borderRadius: 12 },
  audioMsg: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, width: 200 },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 3, borderRadius: 1.5 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, marginLeft: 8 },
  reactionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
  },
  quickReactions: {
    flexDirection: 'row', borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    marginTop: 4, gap: 0,
  },
  qrBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  replyBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 2,
    marginHorizontal: 16, borderRadius: 12, marginBottom: 4,
  },
  emojiPicker: { height: 300, borderTopWidth: 1 },
  emojiSearch: {
    margin: 8, borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  emojiCats: { flexDirection: 'row', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#00000015' },
  emojiCatBtn: { padding: 8, paddingBottom: 6 },
  emojiGrid: { padding: 8, gap: 4 },
  emojiItem: { flex: 1/8, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 8, paddingTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  inputBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  textInputContainer: {
    flex: 1, borderRadius: 22, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 8, maxHeight: 120,
  },
  textInput: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  recordingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8 },
  cancelRecord: { padding: 8 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  actionOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
  actionSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, overflow: 'hidden' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  pairingModalBox: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
  },
  pairingCodeCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  savePairingBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
