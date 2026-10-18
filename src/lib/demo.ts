import { useAuthStore, useProfileStore } from '@/store';

export const DEMO_USER = {
  id: 'demo-user-sophia',
  email: 'sophia@whisper.love',
  user_metadata: { full_name: 'Sophia' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export const DEMO_PROFILE = {
  id: 'demo-user-sophia',
  display_name: 'Sophia',
  avatar_url: null,
  bio: 'Living our love story every day 🌸',
  date_of_birth: '1998-05-12',
};

export const DEMO_PARTNER = {
  id: 'demo-user-liam',
  display_name: 'Liam',
  avatar_url: null,
  bio: 'Forever & always ❤️',
  date_of_birth: '1997-09-24',
};

export const DEMO_COUPLE_ID = 'demo-couple-whisper';

export const DEMO_MESSAGES = [
  {
    id: 'demo-msg-1',
    couple_id: DEMO_COUPLE_ID,
    sender_id: DEMO_PARTNER.id,
    content: 'Good morning my love! Hope your day starts beautifully 🌸',
    type: 'text' as const,
    reply_to: null,
    is_pinned: false,
    edited_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    reactions: [{ id: 'r1', message_id: 'demo-msg-1', user_id: DEMO_USER.id, emoji: '❤️' }],
  },
  {
    id: 'demo-msg-2',
    couple_id: DEMO_COUPLE_ID,
    sender_id: DEMO_USER.id,
    content: 'Morning sweetheart! Counting down until our dinner tonight ✨',
    type: 'text' as const,
    reply_to: 'demo-msg-1',
    is_pinned: false,
    edited_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    reactions: [{ id: 'r2', message_id: 'demo-msg-2', user_id: DEMO_PARTNER.id, emoji: '🥰' }],
  },
  {
    id: 'demo-msg-3',
    couple_id: DEMO_COUPLE_ID,
    sender_id: DEMO_PARTNER.id,
    content: 'I reserved that Italian place we both adore. 7:30 PM under the candlelight 🕯️',
    type: 'text' as const,
    reply_to: null,
    is_pinned: true,
    edited_at: null,
    deleted_at: null,
    created_at: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    reactions: [{ id: 'r3', message_id: 'demo-msg-3', user_id: DEMO_USER.id, emoji: '✨' }],
  },
];

export function enterDemoMode() {
  const demoSession: any = {
    access_token: 'demo-access-token',
    token_type: 'bearer',
    expires_in: 86400,
    refresh_token: 'demo-refresh-token',
    user: DEMO_USER,
  };

  useAuthStore.getState().setSession(demoSession);
  useAuthStore.getState().setCoupleId(DEMO_COUPLE_ID);
  useAuthStore.getState().setPartnerId(DEMO_PARTNER.id);
  useProfileStore.getState().setProfile(DEMO_PROFILE);
  useProfileStore.getState().setPartnerProfile(DEMO_PARTNER);
}
