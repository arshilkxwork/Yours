# Yours

> *"Every word, always yours."*

---

### 📖 About Yours

  *“An encrypted personal diary for authentic self-expression, private milestones, and daily life reflections.”*

  *“A living letter and private sanctuary addressed to only one person in the world. Where every unfiltered conversation, whispered midnight call, shared photo, and sacred memory lives safely—dedicated solely to the two of you.”*

---

## 🏛️ Dual-Layer Architecture

`Yours` is engineered with a **Stealth Dual-Layer Architecture** designed to protect privacy while blending into everyday device use:

```
┌────────────────────────────────────────────────────────┐
│               LAYER 1: THE DISGUISE                    │
│   Japandi Minimalist Mindfulness & Focus Journal       │
│   • Functional Daily Task Planner                      │
│   • Mindful Hydration Tracker                          │
│   • Lo-Fi Focus Audio Soundscapes                      │
│   • Zero partner clues or romance indicators           │
└──────────────────────────┬─────────────────────────────┘
                           │
      [Hidden 4-Tap / Tap-Tap-Hold on ✦ Star Sensor]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            DISGUISED PASSCODE GATEWAY                  │
│       Looks like a personal journal security PIN       │
└──────────────────────────┬─────────────────────────────┘
                           │ [Passcode: 1234]
                           ▼
┌────────────────────────────────────────────────────────┐
│               LAYER 2: THE SECRET VAULT                │
│             Confidential Couples Space                 │
│   • Real-Time Encrypted Conversations                  │
│   • Voice Memos & Audio Recordings                     │
│   • Private Media & Photo Vault                        │
│   • Peer-to-Peer Voice & Video Calls                   │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🌿 Cover Layer: Mindful Journal
- **Aesthetic Daily Planner:** Categorized task management (Mindfulness, Focus, Health, Work).
- **Daily Affirmation Tile:** Curated quotes updated daily; subtly houses the concealed vault sensor.
- **Water & Wellness Tracking:** Interactive hydration counter with progress fill bar.
- **Ambient Focus Audio:** Minimalist waveform-visualized audio sessions.
- **Interactive Tutorial Pad:** A built-in training guide with real-time feedback dots to practice unlocking the vault without breaking cover.

### 🗝️ Hidden Layer: Private Intimacy
- **Real-Time Messaging:** Instant chat with typing status, read receipts, reactions, and reply chains.
- **Voice Notes:** One-tap audio recording and high-fidelity playback.
- **Discreet Voice & Video Calling:** Daily.co integrated peer-to-peer calls.
- **Encrypted Media Vault:** Private shared gallery for photos and keepsakes.
- **Emergency Cover Reset:** App switches back to the innocent journal instantly upon backgrounding or app switching.

---

## 🛠️ Tech Stack

- **Framework:** [Expo](https://expo.dev/) (SDK 52) / [React Native](https://reactnative.dev/)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) v4
- **Language:** TypeScript (Strict Type Checking)
- **Database & Auth:** [Supabase](https://supabase.com/) with Local Encrypted Fallback Storage
- **Audio/Video Calls:** [Daily.co](https://www.daily.co/) WebRTC APIs
- **Animations:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) & Expo Haptics
- **Web & Cloud:** Multi-platform deployment ready ([Vercel](https://vercel.com/))

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/arshilkxwork/Yours.git
cd Yours
npm install
```

### 2. Environment Variables

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Configure your credentials in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_DAILY_DOMAIN=your-daily-domain
DAILY_API_KEY=your_daily_api_key
```

### 3. Run Locally

```bash
# Start development server
npx expo start

# Run on Web
npx expo start --web

# Typecheck
npx tsc --noEmit
```

---

## 🔒 Security & Privacy

- **Safe Remote Tracking:** Environment credentials (`.env`, `.pem`, `.key`) are strictly `.gitignore`'d.
- **Client-Side Disguise:** Zero metadata, push notification payloads, or operating system permission strings mention partner connections.
- **Customizable PIN:** Personal passcode can be updated anytime inside *Settings → Privacy & Passcode*.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
