# Whisper — Setup Guide & Testing Report

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | included with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |
| iOS Simulator | Xcode 15+ | macOS only |
| Android Emulator | Android Studio | or physical device |

---

## 1 — Clone & Install

```bash
cd /Users/arshiloffcampus/Desktop/secret
npm install
```

---

## 2 — Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Fill in real values in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_DAILY_DOMAIN=your-daily-domain
DAILY_API_KEY=your_daily_api_key
```

### Getting Supabase Credentials
1. Create a free account at supabase.com
2. Create a new project → Settings → API
3. Copy `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
4. Copy `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Getting Daily.co Credentials (for calls)
1. Create a free account at daily.co
2. Your domain: `{your-username}.daily.co` → `EXPO_PUBLIC_DAILY_DOMAIN`
3. Developers → API Keys → copy key → `DAILY_API_KEY`

---

## 3 — Set Up Supabase Database

1. Go to Supabase project dashboard
2. Click **SQL Editor**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. Verify tables in **Table Editor**

Enable Realtime: **Database → Replication** → enable for `messages`, `message_reactions`, `message_receipts`

---

## 4 — Run Locally

### iOS Simulator
```bash
npx expo start --ios
```

### Android Emulator
```bash
npx expo start --android
```

### Development Build (recommended — full native modules)
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

---

## 5 — The Secret Access Mechanism

**Triple-tap the 🌸 flower → Enter 4-digit PIN → Private chat unlocks**

- Home screen looks like a lifestyle/wellness app
- The flower avatar top-right: 3 quick taps → PIN modal
- Correct PIN → bloom animation → private messaging
- Wrong PIN × 3 → 30-second lockout

---

## 6 — Feature Status Report

### ✅ Fully Implemented
- Welcome + full onboarding flow
- Email/password auth + password reset
- Profile setup with avatar upload
- Light + Evening dark theme
- 8 accent color options  
- Partner invite code system (generate / join)
- Triple-tap + 4-digit PIN secret access
- Daily inspirational quotes (40 rotating)
- Mood journal with private notes (10 moods)
- Daily questions with private answers (40 rotating)
- Photo memories scrapbook (upload + grid view)
- Shared calendar with event types + countdowns
- Real-time text messaging (Supabase Realtime)
- Optimistic UI message updates
- Emoji picker — 6 categories + search + recent
- Message reactions (8 quick emoji)
- Reply to message
- Delete message (soft delete)
- Read receipts ✓✓
- Typing indicator (broadcast)
- Date separators in chat
- Voice message recording + playback
- Image sharing (multi-select)
- Supabase Row Level Security on all tables
- Private media storage (Supabase Storage)
- Settings: theme, accent, privacy, notifications
- Partner disconnect + sign out

### ⚠️ Requires External Credentials
- Voice calls — UI complete, wire up Daily.co `@daily-co/react-native-daily-js`
- Video calls — UI complete, wire up Daily.co
- Push notifications — tokens stored, needs Supabase Edge Function

### 📌 Not Implemented
- End-to-end encryption (requires Signal Protocol — major addition)
- Auto-expiring disappearing messages (DB column exists, cron job needed)
- GIF support (excluded per requirements)

---

## 7 — External Services

| Service | Plan | Cost |
|---|---|---|
| Supabase | Free tier | Free |
| Daily.co | Free tier (1,000 min/mo) | Free |
| Apple Developer | Required for App Store | $99/year |
| Google Play | Required for Play Store | $25 one-time |
