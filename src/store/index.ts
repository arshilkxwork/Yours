import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthState {
  session: Session | null;
  user: User | null;
  coupleId: string | null;
  partnerId: string | null;
  setSession: (session: Session | null) => void;
  setCoupleId: (id: string | null) => void;
  setPartnerId: (id: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  coupleId: null,
  partnerId: null,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setCoupleId: (coupleId) => set({ coupleId }),
  setPartnerId: (partnerId) => set({ partnerId }),
  signOut: () => set({ session: null, user: null, coupleId: null, partnerId: null }),
}));

// ─── Theme Store ──────────────────────────────────────────────────────────────
type ThemeMode = 'light' | 'evening';

interface ThemeState {
  mode: ThemeMode;
  accentColor: string;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  accentColor: '#94877A',
  setMode: (mode) => set({ mode }),
  setAccentColor: (accentColor) => set({ accentColor }),
}));

// ─── Chat Store ───────────────────────────────────────────────────────────────
interface ChatState {
  isUnlocked: boolean;
  unreadCount: number;
  unlock: () => void;
  lock: () => void;
  setUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isUnlocked: false,
  unreadCount: 0,
  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));

// ─── Profile Store ────────────────────────────────────────────────────────────
interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
}

interface ProfileState {
  profile: ProfileData | null;
  partnerProfile: ProfileData | null;
  setProfile: (profile: ProfileData | null) => void;
  setPartnerProfile: (profile: ProfileData | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  partnerProfile: null,
  setProfile: (profile) => set({ profile }),
  setPartnerProfile: (partnerProfile) => set({ partnerProfile }),
}));
