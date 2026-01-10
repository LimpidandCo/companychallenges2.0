-- =============================================================================
-- Company Challenges - Complete Database Schema
-- =============================================================================
-- Supports both Collective Mode (anonymous) and Individual Mode (authenticated)
-- Run this migration in your Supabase SQL editor or via CLI.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Core Tables
-- =============================================================================

-- Clients (organizations)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  
  -- Mode: 'collective' (no auth), 'individual' (auth required), 'hybrid' (both)
  mode TEXT NOT NULL DEFAULT 'collective' CHECK (mode IN ('collective', 'individual', 'hybrid')),
  
  -- Feature flags stored as JSONB
  features JSONB NOT NULL DEFAULT '{
    "announcements": false,
    "host_videos": false,
    "sprint_structure": false,
    "collective_progress": false,
    "time_based_unlocks": false,
    "milestones": false,
    "reveal_moments": false,
    "micro_quizzes": false,
    "progress_tracking": false,
    "session_persistence": false,
    "private_views": false
  }'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenges (learning trajectories)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  internal_name TEXT NOT NULL,
  public_title TEXT,
  show_public_title BOOLEAN NOT NULL DEFAULT true,
  description TEXT, -- rich text (HTML)
  brand_color TEXT, -- hex color
  support_info TEXT, -- rich text
  visual_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  folder TEXT, -- simple folder/project grouping
  
  -- Scheduling
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sprints (grouped sections within a challenge)
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  visual_url TEXT,
  
  -- Host content
  intro_video_url TEXT,
  recap_video_url TEXT,
  
  -- Scheduling
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments (standalone content units)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  internal_title TEXT NOT NULL,
  public_title TEXT,
  subtitle TEXT,
  description TEXT, -- rich text
  visual_url TEXT,
  media_url TEXT, -- embedded video
  password_hash TEXT, -- bcrypt hash of shared access key
  
  -- Content type
  content_type TEXT NOT NULL DEFAULT 'standard' CHECK (content_type IN ('standard', 'quiz', 'video', 'announcement')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignment Usages (challenge-assignment relationship)
CREATE TABLE IF NOT EXISTS assignment_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  release_at TIMESTAMPTZ,
  label TEXT,
  
  -- Gamification
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  reveal_style TEXT CHECK (reveal_style IN ('instant', 'fade', 'dramatic')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(challenge_id, assignment_id)
);

-- Assignment Variants (relationships between assignments)
CREATE TABLE IF NOT EXISTS assignment_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  target_assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  relationship_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(source_assignment_id, target_assignment_id),
  CHECK(source_assignment_id != target_assignment_id)
);

-- =============================================================================
-- Gamification Tables
-- =============================================================================

-- Micro-quizzes (reflective, non-scored)
CREATE TABLE IF NOT EXISTS micro_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('reflection', 'multiple_choice', 'scale')),
  options JSONB, -- for multiple choice: ["Option A", "Option B", ...]
  scale_min INTEGER,
  scale_max INTEGER,
  scale_labels JSONB, -- {"min": "Not at all", "max": "Very much"}
  position INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements (admin-posted updates)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- rich text
  visual_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Milestones (editorial celebration moments)
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('assignment_complete', 'sprint_complete', 'percentage', 'custom')),
  trigger_value TEXT NOT NULL, -- assignment_id, sprint_id, percentage, or custom key
  celebration_type TEXT NOT NULL CHECK (celebration_type IN ('badge', 'message', 'animation', 'unlock')),
  celebration_content TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Individual Mode Tables
-- =============================================================================

-- Participants (Individual Mode users - Clerk handles auth)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL UNIQUE, -- Clerk's user ID
  display_name TEXT,
  avatar_url TEXT,
  
  -- Privacy settings
  show_in_leaderboard BOOLEAN NOT NULL DEFAULT false,
  show_progress_publicly BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenge Enrollments
CREATE TABLE IF NOT EXISTS challenge_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Progress
  last_assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(participant_id, challenge_id)
);

-- Assignment Progress (per-user completion)
CREATE TABLE IF NOT EXISTS assignment_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  assignment_usage_id UUID NOT NULL REFERENCES assignment_usages(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Quiz responses
  quiz_responses JSONB, -- [{"quiz_id": "...", "response": "...", "responded_at": "..."}]
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(participant_id, assignment_usage_id)
);

-- Milestone Achievements
CREATE TABLE IF NOT EXISTS milestone_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(participant_id, milestone_id)
);

-- =============================================================================
-- Analytics Tables (Anonymous)
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'challenge_view', 'assignment_view', 'assignment_complete', 
    'media_play', 'password_attempt', 'quiz_response'
  )),
  
  -- Context
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  
  -- Anonymous session (cookie-based, not linked to user)
  session_id TEXT NOT NULL,
  
  -- Event data
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_mode ON clients(mode);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_client_id ON challenges(client_id);
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug);
CREATE INDEX IF NOT EXISTS idx_challenges_is_archived ON challenges(is_archived);
CREATE INDEX IF NOT EXISTS idx_challenges_folder ON challenges(folder);
CREATE INDEX IF NOT EXISTS idx_challenges_starts_at ON challenges(starts_at);

-- Sprints
CREATE INDEX IF NOT EXISTS idx_sprints_challenge_id ON sprints(challenge_id);
CREATE INDEX IF NOT EXISTS idx_sprints_position ON sprints(challenge_id, position);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_slug ON assignments(slug);
CREATE INDEX IF NOT EXISTS idx_assignments_content_type ON assignments(content_type);

-- Assignment Usages
CREATE INDEX IF NOT EXISTS idx_assignment_usages_challenge_id ON assignment_usages(challenge_id);
CREATE INDEX IF NOT EXISTS idx_assignment_usages_sprint_id ON assignment_usages(sprint_id);
CREATE INDEX IF NOT EXISTS idx_assignment_usages_assignment_id ON assignment_usages(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_usages_position ON assignment_usages(challenge_id, position);
CREATE INDEX IF NOT EXISTS idx_assignment_usages_release_at ON assignment_usages(release_at);

-- Variants
CREATE INDEX IF NOT EXISTS idx_assignment_variants_source ON assignment_variants(source_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_variants_target ON assignment_variants(target_assignment_id);

-- Micro-quizzes
CREATE INDEX IF NOT EXISTS idx_micro_quizzes_assignment_id ON micro_quizzes(assignment_id);

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_challenge_id ON announcements(challenge_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_challenge_id ON milestones(challenge_id);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_clerk_user_id ON participants(clerk_user_id);

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_participant_id ON challenge_enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_challenge_id ON challenge_enrollments(challenge_id);

-- Progress
CREATE INDEX IF NOT EXISTS idx_assignment_progress_participant_id ON assignment_progress(participant_id);
CREATE INDEX IF NOT EXISTS idx_assignment_progress_assignment_usage_id ON assignment_progress(assignment_usage_id);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_milestone_achievements_participant_id ON milestone_achievements(participant_id);
CREATE INDEX IF NOT EXISTS idx_milestone_achievements_milestone_id ON milestone_achievements(milestone_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_client_id ON analytics_events(client_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_challenge_id ON analytics_events(challenge_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_usages_updated_at BEFORE UPDATE ON assignment_usages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_micro_quizzes_updated_at BEFORE UPDATE ON micro_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenge_enrollments_updated_at BEFORE UPDATE ON challenge_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_progress_updated_at BEFORE UPDATE ON assignment_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies - Public Read Access (Collective Mode)
-- =============================================================================

-- Public can view non-archived challenges
CREATE POLICY "Public can view active challenges"
  ON challenges FOR SELECT
  USING (is_archived = false);

-- Public can view assignments
CREATE POLICY "Public can view assignments"
  ON assignments FOR SELECT
  USING (true);

-- Public can view visible, released assignment usages
CREATE POLICY "Public can view visible assignment usages"
  ON assignment_usages FOR SELECT
  USING (
    is_visible = true
    AND (release_at IS NULL OR release_at <= NOW())
  );

-- Public can view sprints
CREATE POLICY "Public can view sprints"
  ON sprints FOR SELECT
  USING (
    starts_at IS NULL OR starts_at <= NOW()
  );

-- Public can view published announcements
CREATE POLICY "Public can view announcements"
  ON announcements FOR SELECT
  USING (
    published_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Public can view milestones
CREATE POLICY "Public can view milestones"
  ON milestones FOR SELECT
  USING (true);

-- Public can view micro-quizzes
CREATE POLICY "Public can view micro quizzes"
  ON micro_quizzes FOR SELECT
  USING (true);

-- Public can view clients (for branding)
CREATE POLICY "Public can view clients"
  ON clients FOR SELECT
  USING (true);

-- Public can view assignment variants
CREATE POLICY "Public can view variants"
  ON assignment_variants FOR SELECT
  USING (true);

-- =============================================================================
-- RLS Policies - Individual Mode (Authenticated Users)
-- =============================================================================

-- Participants can view their own data
CREATE POLICY "Users can view own participant record"
  ON participants FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Participants can update their own data
CREATE POLICY "Users can update own participant record"
  ON participants FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Participants can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON challenge_enrollments FOR SELECT
  USING (participant_id IN (
    SELECT id FROM participants WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Participants can view their own progress
CREATE POLICY "Users can view own progress"
  ON assignment_progress FOR SELECT
  USING (participant_id IN (
    SELECT id FROM participants WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Participants can update their own progress
CREATE POLICY "Users can update own progress"
  ON assignment_progress FOR UPDATE
  USING (participant_id IN (
    SELECT id FROM participants WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Participants can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON assignment_progress FOR INSERT
  WITH CHECK (participant_id IN (
    SELECT id FROM participants WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Participants can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON milestone_achievements FOR SELECT
  USING (participant_id IN (
    SELECT id FROM participants WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Generate a unique slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := LOWER(REGEXP_REPLACE(text_input, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Limit length and add random suffix
  base_slug := LEFT(base_slug, 50);
  final_slug := base_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Hash a password
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- Verify a password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql;

-- Calculate challenge completion percentage for a participant
CREATE OR REPLACE FUNCTION get_challenge_progress(p_participant_id UUID, p_challenge_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_assignments INTEGER;
  completed_assignments INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_assignments
  FROM assignment_usages
  WHERE challenge_id = p_challenge_id AND is_visible = true;
  
  IF total_assignments = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO completed_assignments
  FROM assignment_progress ap
  JOIN assignment_usages au ON ap.assignment_usage_id = au.id
  WHERE ap.participant_id = p_participant_id
    AND au.challenge_id = p_challenge_id
    AND ap.status = 'completed';
  
  RETURN ROUND((completed_assignments::NUMERIC / total_assignments::NUMERIC) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- Get collective progress for a challenge (anonymous)
CREATE OR REPLACE FUNCTION get_collective_progress(p_challenge_id UUID)
RETURNS TABLE (
  assignment_usage_id UUID,
  view_count BIGINT,
  completion_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as assignment_usage_id,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'assignment_view' THEN ae.session_id END) as view_count,
    COUNT(DISTINCT CASE WHEN ae.event_type = 'assignment_complete' THEN ae.session_id END) as completion_count
  FROM assignment_usages au
  LEFT JOIN analytics_events ae ON ae.assignment_id = au.assignment_id AND ae.challenge_id = p_challenge_id
  WHERE au.challenge_id = p_challenge_id
  GROUP BY au.id;
END;
$$ LANGUAGE plpgsql;
