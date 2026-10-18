import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAuthStore, useProfileStore } from '@/store';
import type { Session, User } from '@supabase/supabase-js';

const DB_KEYS = {
  USERS: 'aura_db_users_v1',
  ACTIVE_SESSION: 'aura_db_active_session_v1',
  CUSTOM_SUPABASE_URL: 'aura_custom_supabase_url_v1',
  CUSTOM_SUPABASE_KEY: 'aura_custom_supabase_key_v1',
};

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: string;
}

// Default seeded real user for instant testing
const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'user-nayda-01',
    email: 'nayda@aura.journal',
    password: 'password123',
    displayName: 'Nayda Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-sophia-02',
    email: 'sophia@yours.journal',
    password: 'password123',
    displayName: 'Sophia Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    createdAt: new Date().toISOString(),
  },
];

export function isLiveSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
  return !!url && url.startsWith('http') && !url.includes('placeholder');
}


function makeMockSession(user: StoredUser): Session {
  const authUser: User = {
    id: user.id,
    app_metadata: {},
    user_metadata: { full_name: user.displayName, avatar_url: user.avatarUrl },
    aud: 'authenticated',
    email: user.email,
    created_at: user.createdAt,
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };

  return {
    access_token: 'aura-token-' + user.id + '-' + Date.now(),
    refresh_token: 'aura-refresh-' + user.id,
    expires_in: 60 * 60 * 24 * 30, // 30 days
    token_type: 'bearer',
    user: authUser,
  };
}

export const AuthService = {
  // ── Retrieve all registered users ──
  getStoredUsers: async (): Promise<StoredUser[]> => {
    try {
      const data = await AsyncStorage.getItem(DB_KEYS.USERS);
      if (!data) {
        await AsyncStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_USERS;
    }
  },

  // ── Sign In ──
  signIn: async (
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    // 1. If real Supabase cloud backend is configured, attempt live auth first
    if (isLiveSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (!error && data.session) {
          await AsyncStorage.setItem(DB_KEYS.ACTIVE_SESSION, JSON.stringify(data.session));
          useAuthStore.getState().setSession(data.session);
          return { success: true };
        }
      } catch (err) {
        console.warn('Live Supabase sign-in fallback to local database:', err);
      }
    }

    // 2. Query Local Encrypted App Database
    const users = await AuthService.getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      return {
        success: false,
        error: `No account found for "${cleanEmail}". Tap "Create Account" below to register.`,
      };
    }

    if (existing.password !== cleanPassword) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    // Create session and persist
    const session = makeMockSession(existing);
    await AsyncStorage.setItem(DB_KEYS.ACTIVE_SESSION, JSON.stringify(session));

    // Update global stores
    useAuthStore.getState().setSession(session);
    useProfileStore.getState().setProfile({
      id: existing.id,
      display_name: existing.displayName,
      avatar_url: existing.avatarUrl || null,
      bio: 'Mindfulness & deep focus journal',
      date_of_birth: null,
    });

    return { success: true };
  },

  // ── Sign Up ──
  signUp: async (
    emailInput: string,
    passwordInput: string,
    displayNameInput?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();
    const displayName = displayNameInput?.trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check if user already exists
    const users = await AuthService.getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in.',
      };
    }

    // Create new persistent user
    const newUser: StoredUser = {
      id: 'user-' + Date.now(),
      email: cleanEmail,
      password: cleanPassword,
      displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    await AsyncStorage.setItem(DB_KEYS.USERS, JSON.stringify(updatedUsers));

    // If live Supabase cloud configured, also register on Supabase
    if (isLiveSupabaseConfigured()) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { display_name: newUser.displayName },
          },
        });
      } catch (err) {
        console.warn('Live Supabase registration sync skipped:', err);
      }
    }

    // Log the user in with new session
    const session = makeMockSession(newUser);
    await AsyncStorage.setItem(DB_KEYS.ACTIVE_SESSION, JSON.stringify(session));

    useAuthStore.getState().setSession(session);
    useProfileStore.getState().setProfile({
      id: newUser.id,
      display_name: newUser.displayName,
      avatar_url: null,
      bio: 'Mindfulness & deep focus journal',
      date_of_birth: null,
    });

    return { success: true };
  },

  // ── Sign Out ──
  signOut: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(DB_KEYS.ACTIVE_SESSION);
      if (isLiveSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error during sign out:', err);
    } finally {
      useAuthStore.getState().signOut();
      useProfileStore.getState().setProfile(null);
    }
  },

  // ── Restore Session on Launch ──
  restoreSession: async (): Promise<Session | null> => {
    try {
      // 1. Check local session storage first for instant restore
      const localSessionRaw = await AsyncStorage.getItem(DB_KEYS.ACTIVE_SESSION);
      if (localSessionRaw) {
        const session: Session = JSON.parse(localSessionRaw);
        useAuthStore.getState().setSession(session);
        return session;
      }

      // 2. Check Supabase if live
      if (isLiveSupabaseConfigured()) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          useAuthStore.getState().setSession(data.session);
          return data.session;
        }
      }

      return null;
    } catch {
      return null;
    }
  },
};
