import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PLAN_TASKS, EVENT_TYPES } from '@/constants/Content';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  TASKS: 'aura_tasks_v1',
  WATER: 'aura_water_v1',
  WATER_DATE: 'aura_water_date_v1',
  FOCUS_SECONDS: 'aura_focus_sec_v1',
  CALENDAR: 'aura_calendar_v1',
  MEMORIES: 'aura_memories_v1',
  CHAT_MESSAGES: 'aura_chat_messages_v1',
  PAIRING_CODE: 'aura_pairing_code_v1',
  PARTNER_NAME: 'aura_partner_name_v1',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlanTask {
  id: string;
  title: string;
  time: string;
  category: string;
  done: boolean;
}

export interface AppCalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  notes: string | null;
  is_recurring: boolean;
}

export interface AppMemory {
  id: string;
  photo_url: string;
  caption: string | null;
  memory_date: string | null;
  created_at: string;
  uploader_id: string;
}

export interface ChatMessage {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string | null;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  reply_to: string | null;
  is_pinned: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  audio_duration?: number;
  reactions?: { id: string; message_id: string; user_id: string; emoji: string }[];
}

// ─── Initial Fallbacks ────────────────────────────────────────────────────────
const INITIAL_MEMORIES: AppMemory[] = [
  {
    id: 'm1',
    uploader_id: 'user-self',
    photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80',
    caption: 'Golden hour walk by the ocean 🌅',
    memory_date: '2025-10-14',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'm2',
    uploader_id: 'user-self',
    photo_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80',
    caption: 'Sunday morning coffee & cozy talks ☕',
    memory_date: '2025-10-02',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'm3',
    uploader_id: 'user-self',
    photo_url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
    caption: 'Our spontaneous weekend getaway in the mountains 🏔️',
    memory_date: '2025-09-18',
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: 'm4',
    uploader_id: 'user-self',
    photo_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80',
    caption: 'Anniversary celebration under the stars ✨',
    memory_date: '2025-08-20',
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
];

const INITIAL_CALENDAR: AppCalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Morning Flow & Meditation 🌿',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'mindfulness',
    notes: '20-min mindful breathing and somatic stretch',
    is_recurring: true,
  },
  {
    id: 'cal-2',
    title: 'Deep Focus: Creative Project ⏱️',
    event_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    event_type: 'focus',
    notes: 'Uninterrupted deep work session at the studio',
    is_recurring: false,
  },
  {
    id: 'cal-3',
    title: 'Weekly Journal Reflection ✍️',
    event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    event_type: 'journal',
    notes: 'Review monthly habits, reflections, and intentions',
    is_recurring: true,
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    couple_id: 'aura_couple',
    sender_id: 'partner',
    content: 'Good morning my love! Hope your day starts with pure peace 🌸',
    type: 'text',
    reply_to: null,
    is_pinned: false,
    edited_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    reactions: [{ id: 'r1', message_id: 'msg-init-1', user_id: 'me', emoji: '❤️' }],
  },
  {
    id: 'msg-init-2',
    couple_id: 'aura_couple',
    sender_id: 'me',
    content: 'Morning sweetheart! Just finished my morning tea, counting down to tonight ✨',
    type: 'text',
    reply_to: 'msg-init-1',
    is_pinned: false,
    edited_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    reactions: [{ id: 'r2', message_id: 'msg-init-2', user_id: 'partner', emoji: '🥰' }],
  },
  {
    id: 'msg-init-3',
    couple_id: 'aura_couple',
    sender_id: 'partner',
    content: 'I reserved that cozy candlelit corner table for us. 7:30 PM 🕯️',
    type: 'text',
    reply_to: null,
    is_pinned: true,
    edited_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    reactions: [{ id: 'r3', message_id: 'msg-init-3', user_id: 'me', emoji: '✨' }],
  },
];

// ─── Data Access Object (DAO) ─────────────────────────────────────────────────
export const AppData = {
  // ── Tasks ──
  getTasks: async (): Promise<PlanTask[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : INITIAL_PLAN_TASKS;
    } catch {
      return INITIAL_PLAN_TASKS;
    }
  },

  saveTasks: async (tasks: PlanTask[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch { /* noop */ }
  },

  addTask: async (title: string, time: string, category: string): Promise<PlanTask[]> => {
    const current = await AppData.getTasks();
    const newTask: PlanTask = {
      id: 'task-' + Date.now(),
      title,
      time,
      category,
      done: false,
    };
    const updated = [newTask, ...current];
    await AppData.saveTasks(updated);
    return updated;
  },

  toggleTask: async (id: string): Promise<PlanTask[]> => {
    const current = await AppData.getTasks();
    const updated = current.map(t => (t.id === id ? { ...t, done: !t.done } : t));
    await AppData.saveTasks(updated);
    return updated;
  },

  deleteTask: async (id: string): Promise<PlanTask[]> => {
    const current = await AppData.getTasks();
    const updated = current.filter(t => t.id !== id);
    await AppData.saveTasks(updated);
    return updated;
  },

  // ── Hydration ──
  getWaterCount: async (): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = await AsyncStorage.getItem(KEYS.WATER_DATE);
      if (savedDate !== today) {
        await AsyncStorage.setItem(KEYS.WATER_DATE, today);
        await AsyncStorage.setItem(KEYS.WATER, '0');
        return 0;
      }
      const count = await AsyncStorage.getItem(KEYS.WATER);
      return count ? parseInt(count, 10) : 6;
    } catch {
      return 6;
    }
  },

  setWaterCount: async (count: number): Promise<void> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(KEYS.WATER_DATE, today);
      await AsyncStorage.setItem(KEYS.WATER, count.toString());
    } catch { /* noop */ }
  },

  // ── Focus Seconds ──
  getFocusSeconds: async (): Promise<number> => {
    try {
      const sec = await AsyncStorage.getItem(KEYS.FOCUS_SECONDS);
      return sec ? parseInt(sec, 10) : 2 * 3600 + 45 * 60;
    } catch {
      return 2 * 3600 + 45 * 60;
    }
  },

  setFocusSeconds: async (sec: number): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.FOCUS_SECONDS, sec.toString());
    } catch { /* noop */ }
  },

  // ── Calendar Events ──
  getCalendarEvents: async (): Promise<AppCalendarEvent[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CALENDAR);
      return data ? JSON.parse(data) : INITIAL_CALENDAR;
    } catch {
      return INITIAL_CALENDAR;
    }
  },

  saveCalendarEvent: async (event: Omit<AppCalendarEvent, 'id'>): Promise<AppCalendarEvent[]> => {
    const current = await AppData.getCalendarEvents();
    const newEvent: AppCalendarEvent = {
      ...event,
      id: 'cal-' + Date.now(),
    };
    const updated = [...current, newEvent];
    await AsyncStorage.setItem(KEYS.CALENDAR, JSON.stringify(updated));
    return updated;
  },

  deleteCalendarEvent: async (id: string): Promise<AppCalendarEvent[]> => {
    const current = await AppData.getCalendarEvents();
    const updated = current.filter(e => e.id !== id);
    await AsyncStorage.setItem(KEYS.CALENDAR, JSON.stringify(updated));
    return updated;
  },

  // ── Memories / Visual Journal ──
  getMemories: async (): Promise<AppMemory[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEMORIES);
      return data ? JSON.parse(data) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  },

  saveMemory: async (photo_url: string, caption: string | null, memory_date: string | null): Promise<AppMemory[]> => {
    const current = await AppData.getMemories();
    const newMem: AppMemory = {
      id: 'mem-' + Date.now(),
      photo_url,
      caption,
      memory_date,
      created_at: new Date().toISOString(),
      uploader_id: 'user-self',
    };
    const updated = [newMem, ...current];
    await AsyncStorage.setItem(KEYS.MEMORIES, JSON.stringify(updated));
    return updated;
  },

  deleteMemory: async (id: string): Promise<AppMemory[]> => {
    const current = await AppData.getMemories();
    const updated = current.filter(m => m.id !== id);
    await AsyncStorage.setItem(KEYS.MEMORIES, JSON.stringify(updated));
    return updated;
  },

  // ── Secret Chat Messages ──
  getMessages: async (): Promise<ChatMessage[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  },

  sendMessage: async (
    content: string | null,
    type: 'text' | 'image' | 'audio' = 'text',
    replyTo: string | null = null,
    audioDuration?: number
  ): Promise<ChatMessage[]> => {
    const current = await AppData.getMessages();
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      couple_id: 'aura_couple',
      sender_id: 'me',
      content,
      type,
      reply_to: replyTo,
      is_pinned: false,
      edited_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      audio_duration: audioDuration,
      reactions: [],
    };
    const updated = [...current, newMsg];
    await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(updated));
    return updated;
  },

  reactToMessage: async (msgId: string, emoji: string): Promise<ChatMessage[]> => {
    const current = await AppData.getMessages();
    const updated = current.map(msg => {
      if (msg.id !== msgId) return msg;
      const existing = msg.reactions ?? [];
      const hasReacted = existing.some(r => r.user_id === 'me' && r.emoji === emoji);
      const newReactions = hasReacted
        ? existing.filter(r => !(r.user_id === 'me' && r.emoji === emoji))
        : [...existing, { id: 'r-' + Date.now(), message_id: msgId, user_id: 'me', emoji }];
      return { ...msg, reactions: newReactions };
    });
    await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(updated));
    return updated;
  },

  deleteMessage: async (msgId: string): Promise<ChatMessage[]> => {
    const current = await AppData.getMessages();
    const updated = current.filter(m => m.id !== msgId);
    await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(updated));
    return updated;
  },

  // ── Secret Pairing Code System ──
  getPairingCode: async (): Promise<string> => {
    let code = await AsyncStorage.getItem(KEYS.PAIRING_CODE);
    if (!code) {
      code = 'AURA-' + Math.floor(1000 + Math.random() * 9000);
      await AsyncStorage.setItem(KEYS.PAIRING_CODE, code);
    }
    return code;
  },

  getPartnerName: async (): Promise<string> => {
    const name = await AsyncStorage.getItem(KEYS.PARTNER_NAME);
    return name || 'Liam';
  },

  setPartnerName: async (name: string): Promise<void> => {
    await AsyncStorage.setItem(KEYS.PARTNER_NAME, name);
  },
};
