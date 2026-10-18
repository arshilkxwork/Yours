-- ═══════════════════════════════════════════════════════════════
-- WHISPER — Complete Database Schema
-- Run this in Supabase SQL Editor (project dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  date_of_birth DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);

-- ─── INVITATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invitations_code_idx ON public.invitations(code);
CREATE INDEX invitations_created_by_idx ON public.invitations(created_by);

-- ─── COUPLES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couples (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_start  DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id <> user2_id)
);

CREATE INDEX couples_user1_idx ON public.couples(user1_id);
CREATE INDEX couples_user2_idx ON public.couples(user2_id);

-- ─── USER SETTINGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode            TEXT NOT NULL DEFAULT 'light',
  accent_color          TEXT NOT NULL DEFAULT '#D9A3B4',
  read_receipts         BOOLEAN NOT NULL DEFAULT TRUE,
  online_status         BOOLEAN NOT NULL DEFAULT TRUE,
  notif_messages        BOOLEAN NOT NULL DEFAULT TRUE,
  notif_calls           BOOLEAN NOT NULL DEFAULT TRUE,
  notif_preview         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MESSAGES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id       UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT,
  type            TEXT NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text','image','video','audio','file')),
  reply_to        UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  disappear_after INTEGER, -- seconds, NULL = permanent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_couple_id_idx ON public.messages(couple_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX messages_sender_id_idx ON public.messages(sender_id);

-- ─── MESSAGE RECEIPTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_receipts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id   UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ,
  read_at      TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);

-- ─── MESSAGE REACTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX reactions_message_id_idx ON public.message_reactions(message_id);

-- ─── MEDIA ATTACHMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_attachments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id     UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size           BIGINT NOT NULL DEFAULT 0,
  duration       INTEGER, -- seconds for audio/video
  thumbnail_path TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX media_message_id_idx ON public.media_attachments(message_id);

-- ─── CALL RECORDS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id    UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type    TEXT NOT NULL CHECK (call_type IN ('voice','video')),
  status       TEXT NOT NULL CHECK (status IN ('missed','answered','rejected','failed')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  duration     INTEGER -- seconds
);

CREATE INDEX calls_couple_id_idx ON public.call_records(couple_id);

-- ─── JOURNAL ENTRIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood        TEXT NOT NULL,
  content     TEXT,
  is_shared   BOOLEAN NOT NULL DEFAULT FALSE,
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

CREATE INDEX journal_user_id_idx ON public.journal_entries(user_id);
CREATE INDEX journal_entry_date_idx ON public.journal_entries(entry_date DESC);

-- ─── QUESTION ANSWERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.question_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_index  INTEGER NOT NULL,
  answer_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  content         TEXT NOT NULL,
  is_shared       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, answer_date)
);

-- ─── MEMORY COLLECTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_collections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id  UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  cover_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MEMORIES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id       UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  uploader_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,
  caption         TEXT,
  memory_date     DATE,
  collection_id   UUID REFERENCES public.memory_collections(id) ON DELETE SET NULL,
  stickers        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memories_couple_id_idx ON public.memories(couple_id);
CREATE INDEX memories_created_at_idx ON public.memories(created_at DESC);

-- ─── CALENDAR EVENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id      UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  event_date     DATE NOT NULL,
  event_type     TEXT NOT NULL DEFAULT 'other',
  notes          TEXT,
  reminder_days  INTEGER,
  is_recurring   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX calendar_couple_id_idx ON public.calendar_events(couple_id);
CREATE INDEX calendar_event_date_idx ON public.calendar_events(event_date);

-- ─── PUSH TOKENS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('ios','android')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function: returns couple_id for the current user
CREATE OR REPLACE FUNCTION public.my_couple_id()
RETURNS UUID AS $$
  SELECT id FROM public.couples
  WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Profiles ──
CREATE POLICY "Own profile access" ON public.profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Partner can view profile" ON public.profiles
  FOR SELECT USING (
    user_id IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ── Invitations ──
CREATE POLICY "Create own invitation" ON public.invitations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "View own invitations" ON public.invitations
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Anyone can view valid invitations to join" ON public.invitations
  FOR SELECT USING (used = FALSE AND expires_at > NOW());

CREATE POLICY "Update invitations" ON public.invitations
  FOR UPDATE USING (TRUE); -- allow marking as used during join flow

-- ── Couples ──
CREATE POLICY "View own couple" ON public.couples
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Create couple" ON public.couples
  FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Delete own couple" ON public.couples
  FOR DELETE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ── User Settings ──
CREATE POLICY "Own settings" ON public.user_settings
  FOR ALL USING (user_id = auth.uid());

-- ── Messages ──
CREATE POLICY "Couple members can view messages" ON public.messages
  FOR SELECT USING (couple_id = public.my_couple_id());

CREATE POLICY "Couple members can insert messages" ON public.messages
  FOR INSERT WITH CHECK (couple_id = public.my_couple_id() AND sender_id = auth.uid());

CREATE POLICY "Own message update" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid() AND couple_id = public.my_couple_id());

-- ── Message Receipts ──
CREATE POLICY "Couple members can view receipts" ON public.message_receipts
  FOR SELECT USING (
    message_id IN (SELECT id FROM public.messages WHERE couple_id = public.my_couple_id())
  );

CREATE POLICY "Own receipt" ON public.message_receipts
  FOR ALL USING (user_id = auth.uid());

-- ── Message Reactions ──
CREATE POLICY "Couple members can view reactions" ON public.message_reactions
  FOR SELECT USING (
    message_id IN (SELECT id FROM public.messages WHERE couple_id = public.my_couple_id())
  );

CREATE POLICY "Couple members can react" ON public.message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    message_id IN (SELECT id FROM public.messages WHERE couple_id = public.my_couple_id())
  );

CREATE POLICY "Own reaction delete" ON public.message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- ── Media Attachments ──
CREATE POLICY "Couple members can view attachments" ON public.media_attachments
  FOR SELECT USING (
    message_id IN (SELECT id FROM public.messages WHERE couple_id = public.my_couple_id())
  );

CREATE POLICY "Own attachments insert" ON public.media_attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM public.messages WHERE couple_id = public.my_couple_id() AND sender_id = auth.uid()
    )
  );

-- ── Call Records ──
CREATE POLICY "Couple members can view calls" ON public.call_records
  FOR SELECT USING (couple_id = public.my_couple_id());

CREATE POLICY "Initiator can insert call" ON public.call_records
  FOR INSERT WITH CHECK (couple_id = public.my_couple_id() AND initiator_id = auth.uid());

-- ── Journal Entries ──
CREATE POLICY "Own journal" ON public.journal_entries
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Partner can view shared journals" ON public.journal_entries
  FOR SELECT USING (
    is_shared = TRUE AND
    user_id IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM public.couples
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ── Question Answers ──
CREATE POLICY "Own answers" ON public.question_answers
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Partner can view shared answers" ON public.question_answers
  FOR SELECT USING (
    is_shared = TRUE AND
    user_id IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ── Memories ──
CREATE POLICY "Couple can view memories" ON public.memories
  FOR SELECT USING (couple_id = public.my_couple_id());

CREATE POLICY "Couple can insert memories" ON public.memories
  FOR INSERT WITH CHECK (couple_id = public.my_couple_id() AND uploader_id = auth.uid());

CREATE POLICY "Own memory delete" ON public.memories
  FOR DELETE USING (uploader_id = auth.uid());

-- ── Memory Collections ──
CREATE POLICY "Couple can view collections" ON public.memory_collections
  FOR SELECT USING (couple_id = public.my_couple_id());

CREATE POLICY "Couple can create collections" ON public.memory_collections
  FOR INSERT WITH CHECK (couple_id = public.my_couple_id());

-- ── Calendar Events ──
CREATE POLICY "Couple can view events" ON public.calendar_events
  FOR SELECT USING (couple_id = public.my_couple_id());

CREATE POLICY "Couple can create events" ON public.calendar_events
  FOR INSERT WITH CHECK (couple_id = public.my_couple_id() AND created_by = auth.uid());

CREATE POLICY "Creator can delete event" ON public.calendar_events
  FOR DELETE USING (created_by = auth.uid());

-- ── Push Tokens ──
CREATE POLICY "Own push tokens" ON public.push_tokens
  FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════
-- Run these separately in Supabase Storage settings or use the SQL below:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-media',
  'private-media',
  FALSE, -- PRIVATE bucket
  52428800, -- 50MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/heic','audio/m4a','audio/mp4','audio/mpeg','video/mp4','video/quicktime','application/pdf','text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for private-media bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'private-media' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view couple media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private-media' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'private-media' AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- ═══════════════════════════════════════════════════════════════
-- REALTIME
-- Enable realtime for messages table
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_receipts;
